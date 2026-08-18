'use server'

import { db, rawQuery } from '@/shared/lib/db'
import { auth } from '@/domains/auth/auth'
import { sql, eq, inArray, and } from 'drizzle-orm'
import { orders, orderItems, orderStatusHistory } from '@/domains/orders/schema'
import { paymentProofs } from '@/domains/payment-proofs/schema'
import { inventory, inventoryMovements } from '@/domains/inventory/schema'
import { cartItems } from '@/domains/cart/schema'
import { productVariants, products, colors, sizes } from '@/domains/catalog/schema'
import { customers } from '@/domains/customers/schema'
import { validateCoupon, calculateDiscount } from '@/domains/discounts-promotions/service'
import { recordCouponUsage } from '@/domains/discounts-promotions/repository'
import { sendOrderConfirmation } from '@/domains/notifications/service'
import type { CreateOrderServiceInput } from './validators'
import type { OrderResult } from './types'

// ── Order number generation ───────────────────────────────────────────────────

async function generateOrderNumber(): Promise<string> {
  const [{ count }] = await rawQuery<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM orders`,
  )
  const next = parseInt(count, 10) + 1
  return `SAV-${String(next).padStart(6, '0')}`
}

// ── Partial payment helpers ───────────────────────────────────────────────────

function getPartialMultiplier(type: string): number {
  switch (type) {
    case 'partial_20': return 0.20
    case 'partial_35': return 0.35
    case 'partial_50': return 0.50
    default: return 1.00
  }
}

// ── createOrder ───────────────────────────────────────────────────────────────
// Uses sequential operations + atomic conditional UPDATE for inventory reservation
// because neon-http driver does not support BEGIN/COMMIT transactions or FOR UPDATE.

export type CreateOrderResult =
  | { success: true; data: OrderResult }
  | { success: false; error: string }

export async function createOrder(
  input: CreateOrderServiceInput,
  reservationExpiryHours: number,
): Promise<CreateOrderResult> {
  if (!process.env.DATABASE_URL) {
    const mockNumber = `SAV-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`
    return {
      success: true,
      data: {
        orderId: crypto.randomUUID(),
        orderNumber: mockNumber,
        totalUsd: 0,
        totalBs: 0,
        status: 'payment_under_review',
      },
    }
  }

  const { personalData, shippingData, paymentData, cartId, idempotencyKey, exchangeRate, shippingCostUsd, couponCode } = input

  // If the buyer is logged in, their session email is the canonical customer identity.
  // This ensures orders are always visible in /mi-cuenta regardless of what email
  // the user fills in the form, and avoids creating duplicate customer records.
  const session = await auth()
  const customerEmail = session?.user?.email ?? personalData.email

  // ── 1. Idempotency check ──────────────────────────────────────────────────
  const existing = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      totalUsd: orders.totalUsd,
      totalBs: orders.totalBs,
      status: orders.status,
    })
    .from(orders)
    .where(eq(orders.idempotencyKey, idempotencyKey))
    .limit(1)

  if (existing[0]) {
    return {
      success: true,
      data: {
        orderId: existing[0].id,
        orderNumber: existing[0].orderNumber,
        totalUsd: Number(existing[0].totalUsd),
        totalBs: Number(existing[0].totalBs),
        status: existing[0].status,
      },
    }
  }

  // ── 2. Get cart items ─────────────────────────────────────────────────────
  const cartRows = await db
    .select({
      cartItemId: cartItems.id,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId))

  if (cartRows.length === 0) {
    return { success: false, error: 'El carrito está vacío.' }
  }

  const variantIds = cartRows.map((r) => r.variantId)

  // ── 3. Get variant prices from DB (never trust client) ────────────────────
  const variantRows = await db
    .select({
      id: productVariants.id,
      price: productVariants.price,
      isActive: productVariants.isActive,
      productId: productVariants.productId,
      productName: products.name,
      sku: productVariants.sku,
      colorName: colors.name,
      sizeName: sizes.name,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(colors, eq(colors.id, productVariants.colorId))
    .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .where(inArray(productVariants.id, variantIds))

  const variantMap = new Map(variantRows.map((v) => [v.id, v]))

  for (const cartRow of cartRows) {
    const variant = variantMap.get(cartRow.variantId)
    if (!variant || !variant.isActive) {
      return { success: false, error: `Una variante del carrito ya no está disponible.` }
    }
  }

  // ── 4. Find or create customer ────────────────────────────────────────────
  // customerEmail is session email (logged-in) or form email (guest).
  const existingCustomer = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, customerEmail))
    .limit(1)

  let customerId: string
  if (existingCustomer[0]) {
    customerId = existingCustomer[0].id
    await db
      .update(customers)
      .set({
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        whatsapp: personalData.whatsapp,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
  } else {
    const [newCustomer] = await db
      .insert(customers)
      .values({
        email: customerEmail,
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        whatsapp: personalData.whatsapp,
      })
      .returning({ id: customers.id })
    customerId = newCustomer.id
  }

  // ── 5. Validate coupon (server-side) ─────────────────────────────────────
  let validatedCouponId: string | null = null
  let couponDiscountType: 'percentage' | 'fixed_usd' | null = null
  let couponDiscountValue = 0

  if (couponCode) {
    const preSubtotal = cartRows.reduce((sum, r) => {
      const v = variantMap.get(r.variantId)
      return sum + (v ? Number(v.price) * r.quantity : 0)
    }, 0)

    const couponResult = await validateCoupon(couponCode, preSubtotal, customerId)
    if (!couponResult.valid) {
      return { success: false, error: couponResult.error }
    }
    validatedCouponId = couponResult.discountId
    couponDiscountType = couponResult.type
    couponDiscountValue = couponResult.value
  }

  // ── 6. Pre-check stock availability ──────────────────────────────────────
  const stockRows = await db
    .select({
      variantId: inventory.variantId,
      quantity: inventory.quantity,
      reserved: inventory.reserved,
    })
    .from(inventory)
    .where(inArray(inventory.variantId, variantIds))

  const stockMap = new Map(stockRows.map((s) => [s.variantId, s]))

  for (const cartRow of cartRows) {
    const stock = stockMap.get(cartRow.variantId)
    const available = stock ? Math.max(0, stock.quantity - stock.reserved) : 0
    if (available < cartRow.quantity) {
      const variant = variantMap.get(cartRow.variantId)
      const name = variant ? `${variant.productName} (${variant.sizeName})` : 'una variante'
      return { success: false, error: `Sin stock suficiente para ${name}. Disponible: ${available}.` }
    }
  }

  // ── 7. Calculate totals ───────────────────────────────────────────────────
  let subtotalUsd = 0
  for (const cartRow of cartRows) {
    const variant = variantMap.get(cartRow.variantId)!
    subtotalUsd += Number(variant.price) * cartRow.quantity
  }

  const couponDiscountUsd =
    validatedCouponId && couponDiscountType
      ? calculateDiscount(couponDiscountType, couponDiscountValue, subtotalUsd)
      : 0

  const discountedSubtotal = Math.max(0, subtotalUsd - couponDiscountUsd)
  const totalUsd = discountedSubtotal + shippingCostUsd
  const totalBs = totalUsd * exchangeRate

  const orderNumber = await generateOrderNumber()

  const reservedUntil = new Date(Date.now() + reservationExpiryHours * 60 * 60 * 1000)

  const hasProof = paymentData.methodType !== 'cash' && !!paymentData.cloudinaryPublicId
  const initialStatus = hasProof ? 'payment_under_review' : 'pending_payment'
  const partialMultiplier = getPartialMultiplier(paymentData.partialPaymentType)

  try {
    // ── 8. Insert order ───────────────────────────────────────────────────
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerId,
        status: initialStatus as typeof orders.$inferInsert['status'],
        subtotalUsd: subtotalUsd.toFixed(2),
        discountUsd: couponDiscountUsd.toFixed(2),
        shippingCostUsd: shippingCostUsd.toFixed(2),
        totalUsd: totalUsd.toFixed(2),
        exchangeRateSnapshot: exchangeRate.toFixed(4),
        totalBs: totalBs.toFixed(2),
        reservationPaymentType:
          paymentData.partialPaymentType as typeof orders.$inferInsert['reservationPaymentType'],
        paymentMethodId: paymentData.methodId,
        shippingSnapshot: {
          zoneId: shippingData.zoneId,
          zoneType: shippingData.zoneType,
          methodId: shippingData.methodId,
          cityId: shippingData.cityId,
          recipientName: shippingData.recipientName,
          state: shippingData.state,
          city: shippingData.city,
          municipality: shippingData.municipality,
          parish: shippingData.parish,
          address: shippingData.address,
          reference: shippingData.reference,
        },
        reservedUntil,
        idempotencyKey,
      })
      .returning({ id: orders.id })

    const orderId = newOrder.id

    // ── 9. Insert order items ─────────────────────────────────────────────
    const orderItemsData = cartRows.map((cartRow) => {
      const variant = variantMap.get(cartRow.variantId)!
      const unitPrice = Number(variant.price)
      return {
        orderId,
        variantId: cartRow.variantId,
        quantity: cartRow.quantity,
        unitPriceUsd: unitPrice.toFixed(2),
        totalUsd: (unitPrice * cartRow.quantity).toFixed(2),
        productSnapshot: {
          productName: variant.productName,
          sku: variant.sku,
          color: variant.colorName,
          size: variant.sizeName,
          unitPriceUsd: unitPrice,
        },
      }
    })
    await db.insert(orderItems).values(orderItemsData)

    // ── 10. Reserve inventory (atomic conditional UPDATE per variant) ──────
    // Uses WHERE (quantity - reserved) >= needed to prevent overselling without FOR UPDATE.
    const reservedVariantIds: string[] = []

    for (const cartRow of cartRows) {
      const updated = await db
        .update(inventory)
        .set({ reserved: sql`${inventory.reserved} + ${cartRow.quantity}` })
        .where(
          and(
            eq(inventory.variantId, cartRow.variantId),
            sql`(${inventory.quantity} - ${inventory.reserved}) >= ${cartRow.quantity}`,
          ),
        )
        .returning({ variantId: inventory.variantId })

      if (updated.length === 0) {
        // Race condition: stock ran out between pre-check and reservation.
        // Undo reservations already made in this loop.
        for (const vid of reservedVariantIds) {
          const qty = cartRows.find((r) => r.variantId === vid)!.quantity
          await db
            .update(inventory)
            .set({ reserved: sql`${inventory.reserved} - ${qty}` })
            .where(eq(inventory.variantId, vid))
        }
        // Delete the order (order items cascade via FK)
        await db.delete(orders).where(eq(orders.id, orderId))

        const variant = variantMap.get(cartRow.variantId)
        const name = variant ? `${variant.productName} (${variant.sizeName})` : 'una variante'
        return { success: false, error: `Sin stock suficiente para ${name}. Intenta de nuevo.` }
      }

      reservedVariantIds.push(cartRow.variantId)
    }

    // ── 11. Insert inventory movements ────────────────────────────────────
    for (const cartRow of cartRows) {
      await db.insert(inventoryMovements).values({
        variantId: cartRow.variantId,
        type: 'reservation',
        quantity: cartRow.quantity,
        reason: `Reserva automática para pedido ${orderNumber}`,
        orderId,
      })
    }

    // ── 12. Insert payment proof (if not cash) ────────────────────────────
    if (hasProof) {
      const amountPaid = Number(paymentData.amountPaid ?? '0') * partialMultiplier

      const methodSpecificMeta: Record<string, string> = {}
      if (paymentData.bankName) methodSpecificMeta.bankName = paymentData.bankName
      if (paymentData.bankPhone) methodSpecificMeta.bankPhone = paymentData.bankPhone
      if (paymentData.clientId) methodSpecificMeta.clientId = paymentData.clientId
      if (paymentData.transactionHash) methodSpecificMeta.transactionHash = paymentData.transactionHash

      await db.insert(paymentProofs).values({
        orderId,
        paymentMethodId: paymentData.methodId,
        amountPaid: amountPaid.toFixed(2),
        currency: paymentData.methodCurrency as typeof paymentProofs.$inferInsert['currency'],
        reference: paymentData.reference ?? '',
        paymentDate: paymentData.paymentDate ?? new Date().toISOString().split('T')[0],
        holderName: paymentData.holderName ?? '',
        cloudinaryPublicId: paymentData.cloudinaryPublicId ?? null,
        cloudinaryUrl: paymentData.cloudinaryUrl ?? null,
        metadata: Object.keys(methodSpecificMeta).length > 0 ? methodSpecificMeta : null,
        status: 'pending',
      })
    }

    // ── 13. Record coupon usage ───────────────────────────────────────────
    if (validatedCouponId) {
      await recordCouponUsage({
        discountId: validatedCouponId,
        customerId,
        orderId,
      })
    }

    // ── 14. Order status history ──────────────────────────────────────────
    await db.insert(orderStatusHistory).values({
      orderId,
      fromStatus: null,
      toStatus: 'pending_payment',
      reason: 'Pedido creado por el cliente',
    })

    if (hasProof) {
      await db.insert(orderStatusHistory).values({
        orderId,
        fromStatus: 'pending_payment',
        toStatus: 'payment_under_review',
        reason: 'Comprobante enviado por el cliente',
      })
    }

    // ── 15. Clear cart ────────────────────────────────────────────────────
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId))

    // Fire-and-forget confirmation email (failure must not fail the order)
    const customerEmail = input.personalData.email
    const customerName = `${input.personalData.firstName} ${input.personalData.lastName}`
    rawQuery<{ name: string; sku: string; qty: number; unit: number }>(
      sql`SELECT ps->>'productName' as name, ps->>'sku' as sku,
               quantity as qty, unit_price_usd::float as unit
          FROM order_items WHERE order_id = ${orderId}`,
    ).then((items) => {
      sendOrderConfirmation({
        orderId,
        orderNumber,
        customerName,
        customerEmail,
        totalUsd,
        totalBs,
        items: items.map((r) => ({ name: r.name, sku: r.sku, qty: Number(r.qty), unitPriceUsd: Number(r.unit) })),
        hasProof,
      }).catch((e) => console.error('[checkout] notification failed silently:', e))
    }).catch(() => {/* non-critical */})

    return {
      success: true,
      data: {
        orderId,
        orderNumber,
        totalUsd,
        totalBs,
        status: initialStatus,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear el pedido.'
    return { success: false, error: message }
  }
}
