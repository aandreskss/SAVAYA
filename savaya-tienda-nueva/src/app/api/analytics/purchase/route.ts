// Meta Conversions API (CAPI) — server-side purchase event with deduplication.
// Called when an order transitions to PAID via admin/orders/service.ts.
// Token never exposed to the client.

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/shared/lib/rate-limit'

const PurchaseSchema = z.object({
  eventId: z.string(),           // shared with browser pixel for deduplication
  orderNumber: z.string(),
  value: z.number().positive(),
  currency: z.string().default('USD'),
  contentIds: z.array(z.string()),
  numItems: z.number().int().positive(),
  clientIpAddress: z.string().optional(),
  clientUserAgent: z.string().optional(),
  fbc: z.string().optional(),    // Meta click ID from cookie
  fbp: z.string().optional(),    // Meta browser ID from cookie
})

export async function POST(req: NextRequest) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    return NextResponse.json({ skipped: true, reason: 'Meta CAPI not configured' })
  }

  // Rate limiting — tied to IP to prevent abuse
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const rl = await checkRateLimit('publicApi', `capi:${ip}`)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
      },
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = PurchaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { eventId, orderNumber, value, currency, contentIds, numItems, clientIpAddress, clientUserAgent, fbc, fbp } = parsed.data

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,           // deduplication key — must match browser pixel event_id
        event_source_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
        action_source: 'website',
        user_data: {
          ...(clientIpAddress && { client_ip_address: clientIpAddress }),
          ...(clientUserAgent && { client_user_agent: clientUserAgent }),
          ...(fbc && { fbc }),
          ...(fbp && { fbp }),
        },
        custom_data: {
          value,
          currency,
          order_id: orderNumber,
          content_ids: contentIds,
          content_type: 'product',
          num_items: numItems,
        },
      },
    ],
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )
    const data = await res.json()
    return NextResponse.json({ ok: res.ok, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analytics/purchase] CAPI failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
