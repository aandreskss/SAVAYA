import { db } from '@/shared/lib/db'
import { orders, orderItems, orderStatusHistory } from './schema'
import { paymentMethods } from '@/domains/payment-methods/schema'
import { productVariants, productMedia } from '@/domains/catalog/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import type {
  OrderListItem,
  OrderDetail,
  OrderDetailItem,
  OrderStatusEvent,
} from '@/domains/customers/types'
import type { OrderStatus } from './state-machine'

// ---------------------------------------------------------------------------
// Customer-facing order queries
// All queries enforce customerId ownership — never rely on UI-only checks.
// ---------------------------------------------------------------------------

export async function getOrdersByCustomerId(
  customerId: string,
): Promise<OrderListItem[]> {
  const orderRows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalUsd: orders.totalUsd,
      totalBs: orders.totalBs,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))

  if (orderRows.length === 0) return []

  const orderIds = orderRows.map((o) => o.id)

  // Fetch all items for these orders in a single query
  const allItems = await db
    .select({
      orderId: orderItems.orderId,
      quantity: orderItems.quantity,
      productSnapshot: orderItems.productSnapshot,
    })
    .from(orderItems)
    .where(
      orderIds.length === 1
        ? eq(orderItems.orderId, orderIds[0])
        : inArray(orderItems.orderId, orderIds),
    )

  // Group by orderId
  const itemsByOrder = new Map<
    string,
    { quantity: number; snapshot: Record<string, unknown> }[]
  >()
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) ?? []
    list.push({
      quantity: item.quantity,
      snapshot: (item.productSnapshot ?? {}) as Record<string, unknown>,
    })
    itemsByOrder.set(item.orderId, list)
  }

  return orderRows.map((o) => {
    const items = itemsByOrder.get(o.id) ?? []
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
    const first = items[0]
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status as OrderStatus,
      totalUsd: o.totalUsd,
      totalBs: o.totalBs,
      itemCount,
      createdAt: o.createdAt,
      firstItemSnapshot: first
        ? {
            name: (first.snapshot.name as string) ?? '',
            imageUrl: first.snapshot.imageUrl as string | undefined,
          }
        : null,
    }
  })
}

export async function getOrderByNumberForCustomer(
  orderNumber: string,
  customerId: string,
): Promise<OrderDetail | null> {
  // The AND on customerId is the ownership check — always enforced here, not just in UI.
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      subtotalUsd: orders.subtotalUsd,
      discountUsd: orders.discountUsd,
      shippingCostUsd: orders.shippingCostUsd,
      totalUsd: orders.totalUsd,
      exchangeRateSnapshot: orders.exchangeRateSnapshot,
      totalBs: orders.totalBs,
      reservationPaymentType: orders.reservationPaymentType,
      shippingSnapshot: orders.shippingSnapshot,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      paymentMethodId: orders.paymentMethodId,
    })
    .from(orders)
    .where(
      and(
        eq(orders.orderNumber, orderNumber),
        eq(orders.customerId, customerId),
      ),
    )
    .limit(1)

  if (!order) return null

  const [rawItems, history, pmRows] = await Promise.all([
    db
      .select({
        id: orderItems.id,
        variantId: orderItems.variantId,
        quantity: orderItems.quantity,
        unitPriceUsd: orderItems.unitPriceUsd,
        totalUsd: orderItems.totalUsd,
        productSnapshot: orderItems.productSnapshot,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id)),
    db
      .select({
        id: orderStatusHistory.id,
        fromStatus: orderStatusHistory.fromStatus,
        toStatus: orderStatusHistory.toStatus,
        reason: orderStatusHistory.reason,
        createdAt: orderStatusHistory.createdAt,
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(orderStatusHistory.createdAt),
    order.paymentMethodId
      ? db
          .select({ name: paymentMethods.name })
          .from(paymentMethods)
          .where(eq(paymentMethods.id, order.paymentMethodId))
          .limit(1)
      : Promise.resolve([]),
  ])

  // Fetch current primary images as fallback for old orders that lack imageUrl in snapshot.
  let imageMap = new Map<string, string>()
  const variantIds = rawItems.map((i) => i.variantId).filter((v): v is string => !!v)
  if (variantIds.length > 0) {
    const pvRows = await db
      .select({ variantId: productVariants.id, productId: productVariants.productId })
      .from(productVariants)
      .where(inArray(productVariants.id, variantIds))

    const productIds = [...new Set(pvRows.map((r) => r.productId))]

    if (productIds.length > 0) {
      const mediaRows = await db
        .select({ productId: productMedia.productId, url: productMedia.url })
        .from(productMedia)
        .where(and(inArray(productMedia.productId, productIds), eq(productMedia.isPrimary, true)))

      const productToImage = new Map(mediaRows.map((m) => [m.productId, m.url]))
      imageMap = new Map(
        pvRows
          .map((r) => [r.variantId, productToImage.get(r.productId) ?? ''] as [string, string])
          .filter(([, v]) => v),
      )
    }
  }

  const items: OrderDetailItem[] = rawItems.map((item) => {
    const snap = (item.productSnapshot ?? {}) as Record<string, unknown>
    const snapshotImageUrl = snap.imageUrl as string | undefined
    const fallbackImageUrl = item.variantId ? imageMap.get(item.variantId) : undefined
    return {
      id: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPriceUsd: item.unitPriceUsd,
      totalUsd: item.totalUsd,
      productSnapshot: {
        ...snap,
        imageUrl: snapshotImageUrl ?? fallbackImageUrl ?? null,
      },
    } as OrderDetailItem
  })

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as OrderStatus,
    subtotalUsd: order.subtotalUsd,
    discountUsd: order.discountUsd,
    shippingCostUsd: order.shippingCostUsd,
    totalUsd: order.totalUsd,
    exchangeRateSnapshot: order.exchangeRateSnapshot,
    totalBs: order.totalBs,
    reservationPaymentType: order.reservationPaymentType,
    shippingSnapshot: (order.shippingSnapshot as Record<string, unknown>) ?? null,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items,
    statusHistory: history as OrderStatusEvent[],
    paymentMethodName: pmRows[0]?.name ?? null,
  }
}
