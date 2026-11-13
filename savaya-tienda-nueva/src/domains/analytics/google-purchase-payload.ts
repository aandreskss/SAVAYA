import { GoogleContextSchema, type GoogleContext } from './google-context'

export type GooglePurchaseOrder = {
  orderNumber: string
  subtotalUsd: number
  discountUsd: number
  shippingUsd: number
  totalUsd: number
  items: Array<{ id: string; name: string; price: number; quantity: number }>
}

/** Payload uses the immutable order snapshots, not current catalog/cart prices. */
export function buildGooglePurchase(
  order: GooglePurchaseOrder,
  context: GoogleContext,
  occurredAt: Date,
) {
  GoogleContextSchema.parse(context)
  if (!order.orderNumber || !Number.isFinite(occurredAt.getTime())) throw new Error('invalid_order')
  const cents = (value: number) => {
    if (!Number.isFinite(value) || value < 0) throw new Error('invalid_amount')
    return Math.round(value * 100)
  }
  const subtotal = cents(order.subtotalUsd)
  const discount = cents(order.discountUsd)
  const shipping = cents(order.shippingUsd)
  if (discount > subtotal || cents(order.totalUsd) !== subtotal - discount + shipping) {
    throw new Error('inconsistent_order_totals')
  }
  if (!order.items.length || order.items.length > 200) throw new Error('invalid_items')
  const lines = order.items.map((item) => {
    if (!item.id || !item.name || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('invalid_item')
    }
    return cents(item.price) * item.quantity
  })
  if (lines.reduce((sum, line) => sum + line, 0) !== subtotal) throw new Error('inconsistent_items')

  // Allocate coupon cents cumulatively, so rounding cannot change the order value.
  let cumulative = 0
  let allocated = 0
  const items = order.items.map((item, index) => {
    cumulative += lines[index]
    const target = subtotal ? Math.round(discount * cumulative / subtotal) : 0
    const itemDiscount = target - allocated
    allocated = target
    return {
      item_id: item.id,
      item_name: item.name,
      price: Number(((lines[index] - itemDiscount) / item.quantity / 100).toFixed(6)),
      quantity: item.quantity,
      ...(itemDiscount ? { discount: Number((itemDiscount / item.quantity / 100).toFixed(6)) } : {}),
    }
  })

  return {
    client_id: context.clientId,
    timestamp_micros: occurredAt.getTime() * 1000,
    events: [{
      name: 'purchase',
      params: {
        transaction_id: order.orderNumber,
        currency: 'USD',
        value: (subtotal - discount) / 100,
        shipping: shipping / 100,
        items,
        ...(context.sessionId ? { session_id: Number(context.sessionId) } : {}),
        engagement_time_msec: 1,
      },
    }],
  }
}
