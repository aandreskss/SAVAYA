import { requireAdminPermission } from '@/domains/admin/lib/require-permission'
import { isConfigured } from '@/domains/integrations/odoo/client'
import { listRecentSyncLogs } from '@/domains/integrations/odoo/repository'
import { OdooControls } from '@/domains/admin/integrations/OdooControls'

export const dynamic = 'force-dynamic'

const ENV_VARS = [
  { key: 'ODOO_URL', label: 'URL del servidor', required: true },
  { key: 'ODOO_DB', label: 'Base de datos', required: true },
  { key: 'ODOO_USER', label: 'Usuario', required: true },
  { key: 'ODOO_PASS', label: 'Contraseña', required: true },
  { key: 'ODOO_WEBHOOK_SECRET', label: 'Webhook secret', required: true },
  { key: 'ODOO_STOCK_LOCATION_ID', label: 'ID de ubicación de stock', required: false },
] as const

function ConfigRow({ label, configured, required }: { label: string; configured: boolean; required: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-text-primary">
        {label}
        {!required && <span className="ml-1 text-xs text-text-secondary">(opcional)</span>}
      </span>
      <span
        className={[
          'text-xs font-medium px-2.5 py-1 rounded-full',
          configured
            ? 'bg-success/15 text-success'
            : required
              ? 'bg-error/15 text-error'
              : 'bg-white/6 text-text-secondary',
        ].join(' ')}
      >
        {configured ? '✓ Configurado' : required ? '✕ Falta' : '— No definido'}
      </span>
    </div>
  )
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default async function OdooIntegrationPage() {
  await requireAdminPermission('integrations:manage')

  const configured = isConfigured()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'
  const webhookUrl = `${appUrl}/api/webhooks/odoo/inventory`

  let logs: Awaited<ReturnType<typeof listRecentSyncLogs>> = []
  if (process.env.DATABASE_URL) {
    try {
      logs = await listRecentSyncLogs(10)
    } catch {
      // table may not exist yet — migration pending
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Integración Odoo</h1>
        <p className="text-sm text-text-secondary mt-1">
          Sincronización de inventario entre Odoo ERP y la tienda. El SKU es el identificador de vínculo.
        </p>
      </div>

      {/* Config status */}
      <section className="bg-surface-2 rounded-2xl p-6 space-y-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Variables de entorno
          </h2>
          <span
            className={[
              'text-xs font-medium px-2.5 py-1 rounded-full',
              configured
                ? 'bg-success/15 text-success'
                : 'bg-warning/15 text-warning',
            ].join(' ')}
          >
            {configured ? 'Listo para conectar' : 'Configuración incompleta'}
          </span>
        </div>

        {ENV_VARS.map(({ key, label, required }) => (
          <ConfigRow
            key={key}
            label={label}
            configured={!!process.env[key]}
            required={required}
          />
        ))}
      </section>

      {/* Interactive controls */}
      <OdooControls />

      {/* Webhook info */}
      <section className="bg-surface-2 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Webhook — actualizaciones en tiempo real
        </h2>
        <p className="text-sm text-text-secondary">
          Configura este endpoint en Odoo para recibir cambios de stock al instante,
          sin esperar al cron horario.
        </p>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-text-secondary mb-1">URL del endpoint</p>
            <code className="block bg-surface rounded-lg px-3 py-2 text-sm font-mono text-text-primary break-all select-all border border-border">
              {webhookUrl}
            </code>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Header requerido</p>
            <code className="block bg-surface rounded-lg px-3 py-2 text-sm font-mono text-text-primary border border-border">
              x-odoo-secret: {'<ODOO_WEBHOOK_SECRET>'}
            </code>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1">Formato del payload (JSON)</p>
            <code className="block bg-surface rounded-lg px-3 py-2 text-sm font-mono text-text-primary border border-border whitespace-pre">
              {`// Un SKU:\n{ "sku": "SAV-001-NEG-38", "qty": 5 }\n\n// Varios SKUs:\n{ "items": [{ "sku": "SAV-001-NEG-38", "qty": 5 }, ...] }`}
            </code>
          </div>
        </div>
      </section>

      {/* Sync log */}
      <section className="bg-surface-2 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Historial de sincronizaciones
        </h2>

        {logs.length === 0 ? (
          <p className="text-sm text-text-secondary">
            {process.env.DATABASE_URL
              ? 'Aún no hay sincronizaciones registradas. Ejecuta la migración 013 para activar el log.'
              : 'Sin base de datos configurada.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-secondary border-b border-border">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium text-right">Synced</th>
                  <th className="pb-2 font-medium text-right">Skipped</th>
                  <th className="pb-2 font-medium text-right">Failed</th>
                  <th className="pb-2 font-medium text-right">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="text-text-primary">
                    <td className="py-2.5 text-xs text-text-secondary whitespace-nowrap">
                      {formatDate(log.startedAt)}
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/6 text-text-secondary">
                        {log.type === 'full_sync' ? 'Cron' : 'Webhook'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={[
                          'text-xs px-2 py-0.5 rounded-full',
                          log.status === 'success'
                            ? 'bg-success/15 text-success'
                            : log.status === 'partial'
                              ? 'bg-warning/15 text-warning'
                              : 'bg-error/15 text-error',
                        ].join(' ')}
                      >
                        {log.status === 'success'
                          ? 'Exitoso'
                          : log.status === 'partial'
                            ? 'Parcial'
                            : 'Error'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">{log.itemsSynced}</td>
                    <td className="py-2.5 text-right text-text-secondary">{log.itemsSkipped}</td>
                    <td className="py-2.5 text-right">
                      {log.itemsFailed > 0 ? (
                        <span className="text-error">{log.itemsFailed}</span>
                      ) : (
                        <span className="text-text-secondary">0</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-text-secondary">
                      {formatDuration(log.durationMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
