'use client'

import { useState, useTransition } from 'react'
import { testOdooConnectionAction, triggerInventorySyncAction } from './actions'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui/Toast'

export function OdooControls() {
  const [isPending, startTransition] = useTransition()
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [syncResult, setSyncResult] = useState<{
    synced: number
    skipped: number
    failed: number
    durationMs: number
  } | null>(null)

  function handleTestConnection() {
    startTransition(async () => {
      setTestResult(null)
      const result = await testOdooConnectionAction()
      if (result.success) {
        setTestResult({ ok: true, message: `Conectado · ${result.data.database} · ${result.data.username}` })
        toast.success('Conexión exitosa con Odoo')
      } else {
        setTestResult({ ok: false, message: result.error })
        toast.error('Error de conexión')
      }
    })
  }

  function handleSync() {
    startTransition(async () => {
      setSyncResult(null)
      const result = await triggerInventorySyncAction()
      if (result.success) {
        setSyncResult(result.data)
        toast.success(`Sync completado — ${result.data.synced} variantes actualizadas`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Test connection */}
      <div className="bg-surface-2 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Prueba de conexión
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Verifica que las credenciales sean correctas antes de sincronizar.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestConnection}
            isLoading={isPending}
          >
            Probar conexión
          </Button>

          {testResult && (
            <span
              className={[
                'text-sm px-3 py-1 rounded-full',
                testResult.ok
                  ? 'bg-success/15 text-success'
                  : 'bg-error/15 text-error',
              ].join(' ')}
            >
              {testResult.ok ? '✓' : '✕'} {testResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Manual sync */}
      <div className="bg-surface-2 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Sincronización manual
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Descarga todas las cantidades desde Odoo y actualiza el inventario de la tienda.
            El cron automático hace esto cada hora.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSync}
            isLoading={isPending}
          >
            Sincronizar inventario ahora
          </Button>

          {syncResult && (
            <span className="text-sm text-text-secondary">
              ✓ {syncResult.synced} actualizadas · {syncResult.skipped} no encontradas · {syncResult.failed} fallidas
              · {(syncResult.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
