import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateStockBySku } from '@/domains/catalog/repository'
import { saveOdooSyncLog } from '@/domains/integrations/odoo/repository'

// Receives real-time stock updates pushed from Odoo.
// Odoo must be configured to POST to this endpoint when stock.quant changes.
// Protected by ODOO_WEBHOOK_SECRET compared against x-odoo-secret header.

// Accepts either a single item or an array:
//   { sku: "SKU-001", qty: 5 }
//   { items: [{ sku: "SKU-001", qty: 5 }, ...] }
const SingleItemSchema = z.object({ sku: z.string().min(1), qty: z.number().int().min(0) })
const PayloadSchema = z.union([
  SingleItemSchema,
  z.object({ items: z.array(SingleItemSchema).min(1) }),
])

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.ODOO_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const incomingSecret = request.headers.get('x-odoo-secret')
  if (incomingSecret !== webhookSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DB configured' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = PayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const items =
    'items' in parsed.data ? parsed.data.items : [{ sku: parsed.data.sku, qty: parsed.data.qty }]

  const startedAt = new Date()
  const startMs = Date.now()

  try {
    const result = await updateStockBySku(items)
    const durationMs = Date.now() - startMs

    await saveOdooSyncLog({
      type: 'webhook',
      status: result.failed.length === 0 ? 'success' : 'partial',
      itemsSynced: result.synced,
      itemsSkipped: result.skipped,
      itemsFailed: result.failed.length,
      errorMessage: result.failed.length > 0 ? `Failed SKUs: ${result.failed.join(', ')}` : null,
      durationMs,
      startedAt,
      completedAt: new Date(),
    })

    return NextResponse.json({ synced: result.synced, skipped: result.skipped, failed: result.failed.length })
  } catch (error) {
    const durationMs = Date.now() - startMs
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('[webhook/odoo/inventory] Failed:', error)

    await saveOdooSyncLog({
      type: 'webhook',
      status: 'error',
      itemsSynced: 0,
      itemsSkipped: 0,
      itemsFailed: items.length,
      errorMessage,
      durationMs,
      startedAt,
      completedAt: new Date(),
    })

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
