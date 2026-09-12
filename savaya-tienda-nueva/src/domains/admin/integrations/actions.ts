'use server'

import { requireAdminPermission } from '@/domains/admin/lib/require-permission'
import { testConnection, isConfigured } from '@/domains/integrations/odoo/client'
import { getAllStockLevels } from '@/domains/integrations/odoo/inventory'
import { updateStockBySku } from '@/domains/catalog/repository'
import { saveOdooSyncLog } from '@/domains/integrations/odoo/repository'

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function testOdooConnectionAction(): Promise<ActionResult<{ database: string; username: string }>> {
  await requireAdminPermission('integrations:manage')

  if (!isConfigured()) {
    return { success: false, error: 'Odoo no está configurado. Verifica las variables de entorno.' }
  }

  const info = await testConnection()

  if (!info.connected) {
    return { success: false, error: info.error ?? 'No se pudo conectar con Odoo' }
  }

  return {
    success: true,
    data: {
      database: info.database ?? '',
      username: info.username ?? '',
    },
  }
}

export async function triggerInventorySyncAction(): Promise<
  ActionResult<{ synced: number; skipped: number; failed: number; durationMs: number }>
> {
  await requireAdminPermission('integrations:manage')

  if (!isConfigured()) {
    return { success: false, error: 'Odoo no está configurado. Verifica las variables de entorno.' }
  }

  const startedAt = new Date()
  const startMs = Date.now()

  try {
    const stockItems = await getAllStockLevels()
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

    return {
      success: true,
      data: { synced: result.synced, skipped: result.skipped, failed: result.failed.length, durationMs },
    }
  } catch (error) {
    const durationMs = Date.now() - startMs
    const errorMessage = error instanceof Error ? error.message : String(error)

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

    return { success: false, error: errorMessage }
  }
}
