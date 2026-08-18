import { db, rawQuery } from '@/shared/lib/db'
import { sql, eq, inArray } from 'drizzle-orm'
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
  // Uses a sequence count derived from the current orders count to produce SAV-XXXXXX
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
    default: return 1.00 // 'full'
  }
}

// ── createOrder ───────────────────────────────────────────────────────────────
// The only place where an Order is created. Runs inside a transaction with
// SELECT ... FOR UPDATE to prevent overselling.

export type CreateOrderResult =
  | { success: true; data: OrderResult }
  | { success: false; error: string }

export async function createOrder(
  input: CreateOrderServiceInput,
  reservationExpiryHours: number,
): Promise<CreateOrderResult> {
  if (!process.env.DATABASE_URL) {
    // Dev fallback — no DB
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

  // Ensure all variants still active
  for (const cartRow of cartRows) {
    const variant = variantMap.get(cartRow.variantId)
    if (!variant || !variant.isActive) {
      return { success: false, error: `Una variante del carrito ya no está disponible.` }
    }
  }

  // ── 4. Find or create customer ────────────────────────────────────────────
  const existingCustomer = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, personalData.email))
    .limit(1)

  let customerId: string
  if (existingCustomer[0]) {
    customerId = existingCustomer[0].id
    // Update contact info if changed
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
        email: personalData.email,
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        whatsapp: personalData.whatsapp,
      })
      .returning({ id: customers.id })
    customerId = newCustomer.id
  }

  // ── 5. Validate coupon (server-side) ─────────────────────────────────────
  let validatedCouponId: string | null = null
  // Store discount params for recalculation inside transaction
  let couponDiscountType: 'percentage' | 'fixed_usd' | null = null
  let couponDiscountValue = 0

  if (couponCode) {
    // Pre-calculate subtotal for min_order_usd check (best-effort; real amounts inside tx)
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

  // ── 6. Transaction: lock stock, create order ──────────────────────────────
  try {
    const result = await db.transaction(async (tx) => {
      // Lock inventory rows to prevent race condition (UUIDs come from our DB, not user input)
      const uuidsLiteral = `{${variantIds.join(',')}}`
      await tx.execute(
        sql`SELECT id FROM inventory WHERE variant_id = ANY(${uuidsLiteral}::uuid[]) FOR UPDATE`,
      )

      // Re-read stock inside transaction
      const stockRows = await tx
        .select({
          variantId: inventory.variantId,
          quantity: inventory.quantity,
          reserved: inventory.reserved,
        })
        .from(inventory)
        .where(inArray(inventory.variantId, variantIds))

      const stockMap = new Map(stockRows.map((s) => [s.variantId, s]))

      // Verify stock for each cart item
      for (const cartRow of cartRows) {
        const stock = stockMap.get(cartRow.variantId)
        const available = stock ? Math.max(0, stock.quantity - stock.reserved) : 0
        if (available < cartRow.quantity) {
          const variant = variantMap.get(cartRow.variantId)
          const name = variant ? `${variant.productName} (${variant.sizeName})` : 'una variante'
          throw new Error(`Sin stock suficiente para ${name}. Disponible: ${available}.`)
        }
      }

      // Calculate totals from DB prices (server is source of truth)
      let subtotalUsd = 0
      for (const cartRow of cartRows) {
        const variant = variantMap.get(cartRow.variantId)!
        subtotalUsd += Number(variant.price) * cartRow.quantity
      }

      // Apply coupon discount to subtotal (shipping excluded from discount)
      const couponDiscountUsd =
        validatedCouponId && couponDiscountType
          ? calculateDiscount(couponDiscountType, couponDiscountValue, subtotalUsd)
          : 0

      const discountedSubtotal = Math.max(0, subtotalUsd - couponDiscountUsd)
      const totalUsd = discountedSubtotal + shippingCostUsd
      const totalBs = totalUsd * exchangeRate

      const orderNumber = await generateOrderNumber()

      const reservedUntil = new Date(
        Date.now() + reservationExpiryHours * 60 * 60 * 1000,
      )

      const hasProof =
        paymentData.methodType !== 'cash' && !!paymentData.cloudinaryPublicId

      const initialStatus = hasProof ? 'payment_under_review' : 'pending_payment'

      const partialMultiplier = getPartialMultiplier(paymentData.partialPaymentType)

      // Insert order
      const [newOrder] = await tx
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

      // Insert order items (snapshot product info at order time)
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
      await tx.insert(orderItems).values(orderItemsData)

      // Reserve inventory: insert movement + update reserved count
      for (const cartRow of cartRows) {
        await tx.insert(inventoryMovements).values({
          variantId: cartRow.variantId,
          type: 'reservation',
          quantity: cartRow.quantity,
          reason: `Reserva automática para pedido ${orderNumber}`,
          orderId,
        })

        await tx
          .update(inventory)
          .set({ reserved: sql`${inventory.reserved} + ${cartRow.quantity}` })
          .where(eq(inventory.variantId, cartRow.variantId))
      }

      // Insert payment proof (if not cash)
      if (hasProof) {
        const amountPaid = Number(paymentData.amountPaid ?? '0') * partialMultiplier

        const methodSpecificMeta: Record<string, string> = {}
        if (paymentData.bankName) methodSpecificMeta.bankName = paymentData.bankName
        if (paymentData.bankPhone) methodSpecificMeta.bankPhone = paymentData.bankPhone
        if (paymentData.clientId) methodSpecificMeta.clientId = paymentData.clientId
        if (paymentData.transactionHash) methodSpecificMeta.transactionHash = paymentData.transactionHash

        await tx.insert(paymentProofs).values({
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

      // Record coupon usage (inside transaction so it's atomic with order creation)
      if (validatedCouponId) {
        await recordCouponUsage(tx, {
          discountId: validatedCouponId,
          customerId,
          orderId,
        })
      }

      // Order status history
      await tx.insert(orderStatusHistory).values({
        orderId,
        fromStatus: null,
        toStatus: 'pending_payment',
        reason: 'Pedido creado por el cliente',
      })

      if (hasProof) {
        await tx.insert(orderStatusHistory).values({
          orderId,
          fromStatus: 'pending_payment',
          toStatus: 'payment_under_review',
          reason: 'Comprobante enviado por el cliente',
        })
      }

      // Clear cart
      await tx.delete(cartItems).where(eq(cartItems.cartId, cartId))

      return {
        success: true as const,
        data: {
          orderId,
          orderNumber,
          totalUsd,
          totalBs,
          status: initialStatus,
        },
      }
    })

    // Fire-and-forget order confirmation email (outside transaction — failure must not rollback the order)
    if (result.success && result.data) {
      const { orderId, orderNumber: on, totalUsd: tu, totalBs: tb } = result.data
      const customerEmail = input.personalData.email
      const customerName = `${input.personalData.firstName} ${input.personalData.lastName}`
      const items = (await rawQuery<{ name: string; sku: string; qty: number; unit: number }>(
        sql`SELECT ps->>'productName' as name, ps->>'sku' as sku,
                   quantity as qty, unit_price_usd::float as unit
            FROM order_items WHERE order_id = ${orderId}`,
      )).map((r) => ({ name: r.name, sku: r.sku, qty: Number(r.qty), unitPriceUsd: Number(r.unit) }))

      sendOrderConfirmation({
        orderId,
        orderNumber: on,
        customerName,
        customerEmail,
        totalUsd: tu,
        totalBs: tb,
        items,
        hasProof: !!input.paymentData.cloudinaryPublicId,
      }).catch((e) => console.error('[checkout] notification failed silently:', e))
    }

    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear el pedido.'
    return { success: false, error: message }
  }
}
