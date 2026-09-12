'use client'

import { useState, useTransition } from 'react'
import { testOdooConnectionAction, triggerInventorySyncAction } from './actions'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui/Toast'

export function OdooControls() {
  const [isPending, startTransition] = useTransition()
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [syncResult, setSyncResult] = useState<{
    synced: number; skipped: number; failed: number; durationMs: number
  } | null>(null)

  function handleTestConnection() {
    startTransition(async () => {
      setTestResult(null)
      const result = await testOdooConnectionAction()
      if (result.success) {
        setTestResult({ ok: true, message: `${result.data.database} · ${result.data.username}` })
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Test de conexión */}
      <section className="bg-surface-2 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Prueba de conexión
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Verifica las credenciales antes de sincronizar.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleTestConnection}
          isLoading={isPending}
          className="w-full justify-center"
        >
          Probar conexión
        </Button>

        {testResult && (
          <div className={[
            'flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm',
            testResult.ok ? 'bg-success/10 text-success' : 'bg-error/10 text-error',
          ].join(' ')}>
            <span className="mt-0.5 shrink-0">{testResult.ok ? '✓' : '✕'}</span>
            <span className="text-xs leading-relaxed">{testResult.message}</span>
          </div>
        )}
      </section>

      {/* Sync manual */}
      <section className="bg-surface-2 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Sincronización manual
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Descarga todas las cantidades desde Odoo ahora.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSync}
          isLoading={isPending}
          className="w-full justify-center"
        >
          Sincronizar inventario
        </Button>

        {syncResult && (
          <div className="bg-success/10 rounded-xl px-3 py-2.5 text-xs text-success space-y-0.5">
            <p className="font-medium">Sync completado</p>
            <p className="text-success/80">
              {syncResult.synced} actualizadas · {syncResult.skipped} no encontradas
              {syncResult.failed > 0 && ` · ${syncResult.failed} fallidas`}
              {' · '}{(syncResult.durationMs / 1000).toFixed(1)}s
            </p>
          </div>
        )}
      </section>

    </div>
  )
}
