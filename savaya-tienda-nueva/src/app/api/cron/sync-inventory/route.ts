import { NextRequest, NextResponse } from 'next/server'
import { getAllStockLevels } from '@/domains/integrations/odoo/inventory'
import { isConfigured } from '@/domains/integrations/odoo/client'
import { updateStockBySku } from '@/domains/catalog/repository'
import { saveOdooSyncLog } from '@/domains/integrations/odoo/repository'

// Full inventory sync from Odoo — runs on a schedule via Upstash QStash (POST)
// or can be triggered manually (GET). Protected by x-cron-secret header.

async function handler(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  }

  const headerSecret = request.headers.get('x-cron-secret')
  const urlSecret = new URL(request.url).searchParams.get('secret')
  if (headerSecret !== cronSecret && urlSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DB configured — skipping' }, { status: 200 })
  }

  if (!isConfigured()) {
    return NextResponse.json({ error: 'Odoo not configured — skipping' }, { status: 200 })
  }

  const startedAt = new Date()
  const startMs = Date.now()

  try {
    const stockItems = await getAllStockLevels()

    if (stockItems.length === 0) {
      await saveOdooSyncLog({
        type: 'full_sync',
        status: 'success',
        itemsSynced: 0,
        itemsSkipped: 0,
        itemsFailed: 0,
        durationMs: Date.now() - startMs,
        startedAt,
        completedAt: new Date(),
      })
      return NextResponse.json({ synced: 0, skipped: 0, failed: 0, message: 'No stock items in Odoo' })
    }

    const result = await updateStockBySku(stockItems)
    const durationMs = Date.now() - startMs

    await saveOdooSyncLog({
      type: 'full_sync',
      status: result.failed.length === 0 ? 'success' : 'partial',
      itemsSynced: result.synced,
      itemsSkipped: result.skipped,
      itemsFailed: result.failed.length,
      errorMessage: result.failed.length > 0 ? `Failed SKUs: ${result.failed.join(', ')}` : null,
      durationMs,
      startedAt,
      completedAt: new Date(),
    })

    return NextResponse.json({
      synced: result.synced,
      skipped: result.skipped,
      failed: result.failed.length,
      durationMs,
    })
  } catch (error) {
    const durationMs = Date.now() - startMs
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('[cron/sync-inventory] Sync failed:', error)

    await saveOdooSyncLog({
      type: 'full_sync',
      status: 'error',
      itemsSynced: 0,
      itemsSkipped: 0,
      itemsFailed: 0,
      errorMessage,
      durationMs,
      startedAt,
      completedAt: new Date(),
    })

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export { handler as GET, handler as POST }
