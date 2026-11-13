import { sql } from 'drizzle-orm'
import { rawQuery } from '@/shared/lib/db'
import { GoogleContextSchema } from './google-context'
import { buildGooglePurchase } from './google-purchase-payload'

type ClaimedPurchase = {
  order_id: string
  context: unknown
  attempts: number
  occurred_at: string | Date
}

/** No throw into payment processing, and no Google secret or customer data in logs. */
export async function deliverGooglePurchase(orderId: string): Promise<string> {
  const measurementId = process.env.NEXT_PUBLIC_GA4_ID
  const apiSecret = process.env.GA4_API_SECRET
  if (!measurementId || !apiSecret) {
    console.warn('[google-purchase] Configuration missing; purchase remains queued')
    return 'not_configured'
  }
  if (process.env.VERCEL_ENV !== 'production' && process.env.GA4_ALLOW_NON_PRODUCTION !== 'true') {
    return 'non_production'
  }

  let claim: ClaimedPurchase | undefined
  try {
    // One atomic statement is safe with neon-http and concurrent approval/cron.
    // Every entry originates at checkout; historical orders are never backfilled.
    ;[claim] = await rawQuery<ClaimedPurchase>(sql`
      UPDATE google_purchase_events g
      SET state = 'sending', attempts = g.attempts + 1,
          lease_until = now() + interval '5 minutes',
          occurred_at = COALESCE(g.occurred_at, (
            SELECT MIN(h.created_at) FROM order_status_history h
            WHERE h.order_id = g.order_id AND h.to_status = 'paid'
          ))
      FROM orders o
      WHERE g.order_id = ${orderId} AND o.id = g.order_id
        AND o.status IN ('paid', 'preparing', 'shipped', 'delivered')
        AND g.context IS NOT NULL AND g.sent_at IS NULL
        AND g.attempts < 10 AND g.next_attempt_at <= now()
        AND (g.state = 'pending' OR (g.state = 'sending' AND g.lease_until < now()))
        AND EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id AND h.to_status = 'paid')
      RETURNING g.order_id, g.context, g.attempts, g.occurred_at
    `)
    if (!claim) return 'not_eligible'

    const context = GoogleContextSchema.parse(claim.context)
    if (context.measurementId !== measurementId) throw new Error('measurement_id_mismatch')
    const occurredAt = new Date(claim.occurred_at)
    if (Date.now() - occurredAt.getTime() > 72 * 60 * 60 * 1000) throw new Error('event_expired')

    const [order] = await rawQuery<{
      order_number: string; subtotal_usd: string; discount_usd: string
      shipping_cost_usd: string; total_usd: string
    }>(sql`SELECT order_number, subtotal_usd, discount_usd, shipping_cost_usd, total_usd
           FROM orders WHERE id = ${orderId} LIMIT 1`)
    if (!order) throw new Error('order_missing')
    const rows = await rawQuery<{
      id: string; product_snapshot: { name?: string; sku?: string }
      unit_price_usd: string; quantity: number
    }>(sql`SELECT id, product_snapshot, unit_price_usd, quantity FROM order_items
           WHERE order_id = ${orderId} ORDER BY id`)
    const payload = buildGooglePurchase({
      orderNumber: order.order_number,
      subtotalUsd: Number(order.subtotal_usd),
      discountUsd: Number(order.discount_usd),
      shippingUsd: Number(order.shipping_cost_usd),
      totalUsd: Number(order.total_usd),
      items: rows.map((item) => ({
        id: item.product_snapshot.sku || item.id,
        name: item.product_snapshot.name || '',
        price: Number(item.unit_price_usd), quantity: item.quantity,
      })),
    }, context, occurredAt)

    const url = new URL('https://www.google-analytics.com/mp/collect')
    url.searchParams.set('measurement_id', measurementId)
    url.searchParams.set('api_secret', apiSecret)
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error(`google_http_${response.status}`)

    // An HTTP success means accepted by the endpoint, not verified in GA reports.
    await rawQuery(sql`UPDATE google_purchase_events SET state = 'sent', sent_at = now(),
      lease_until = NULL, last_error = NULL WHERE order_id = ${orderId} AND state = 'sending'
      AND attempts = ${claim.attempts}`)
    return 'sent'
  } catch (error) {
    const code = error instanceof Error && /^[a-z_0-9]+$/.test(error.message)
      ? error.message : 'delivery_failed'
    console.error('[google-purchase]', code)
    if (claim) {
      const terminal = ['measurement_id_mismatch', 'event_expired', 'invalid_order',
        'invalid_amount', 'invalid_item', 'invalid_items', 'inconsistent_order_totals',
        'inconsistent_items', 'order_missing'].includes(code) || claim.attempts >= 10
      await rawQuery(sql`UPDATE google_purchase_events
        SET state = ${terminal ? 'failed' : 'pending'}, last_error = ${code}, lease_until = NULL,
            next_attempt_at = now() + (${Math.min(360, 5 * 2 ** (claim.attempts - 1))} * interval '1 minute')
        WHERE order_id = ${orderId} AND attempts = ${claim.attempts} AND state = 'sending'`
      ).catch(() => { console.error('[google-purchase] Could not update retry state') })
    }
    return 'failed'
  }
}

export async function retryGooglePurchases(): Promise<Record<string, number>> {
  const rows = await rawQuery<{ order_id: string }>(sql`
    SELECT g.order_id FROM google_purchase_events g JOIN orders o ON o.id = g.order_id
    WHERE o.status IN ('paid', 'preparing', 'shipped', 'delivered')
      AND g.sent_at IS NULL AND g.context IS NOT NULL AND g.attempts < 10
      AND g.next_attempt_at <= now()
      AND (g.state = 'pending' OR (g.state = 'sending' AND g.lease_until < now()))
    ORDER BY g.next_attempt_at LIMIT 20
  `)
  const result: Record<string, number> = {}
  // Bounded batches keep daily recovery inside the route's execution limit.
  for (let start = 0; start < rows.length; start += 5) {
    const statuses = await Promise.all(rows.slice(start, start + 5).map((row) => deliverGooglePurchase(row.order_id)))
    for (const status of statuses) result[status] = (result[status] ?? 0) + 1
  }
  return result
}
