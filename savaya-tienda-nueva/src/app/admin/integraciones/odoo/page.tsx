import { requireAdminPermission } from '@/domains/admin/lib/require-permission'
import { isConfigured } from '@/domains/integrations/odoo/client'
import { listRecentSyncLogs } from '@/domains/integrations/odoo/repository'
import { OdooControls } from '@/domains/admin/integrations/OdooControls'

export const dynamic = 'force-dynamic'

const ENV_VARS = [
  { key: 'ODOO_URL',              label: 'URL del servidor',          required: true  },
  { key: 'ODOO_DB',               label: 'Base de datos',             required: true  },
  { key: 'ODOO_USER',             label: 'Usuario',                   required: true  },
  { key: 'ODOO_PASS',             label: 'Contraseña',                required: true  },
  { key: 'ODOO_WEBHOOK_SECRET',   label: 'Webhook secret',            required: true  },
  { key: 'ODOO_STOCK_LOCATION_ID',label: 'ID de ubicación de stock',  required: false },
] as const

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={[
      'inline-block h-2 w-2 rounded-full',
      ok ? 'bg-success animate-pulse' : 'bg-warning',
    ].join(' ')} />
  )
}

function ConfigRow({ label, configured, required }: {
  label: string
  configured: boolean
  required: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2">
        <StatusDot ok={configured} />
        <span className="text-sm text-text-primary">{label}</span>
        {!required && (
          <span className="text-xs text-text-secondary bg-white/5 px-1.5 py-0.5 rounded">
            opcional
          </span>
        )}
      </div>
      <span className={[
        'text-xs font-medium',
        configured ? 'text-success' : required ? 'text-error' : 'text-text-secondary',
      ].join(' ')}>
        {configured ? 'Configurado' : required ? 'Falta' : 'No definido'}
      </span>
    </div>
  )
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
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
    try { logs = await listRecentSyncLogs(10) } catch { /* migration pending */ }
  }

  const lastSync = logs[0] ?? null

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold/15">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="#CA8C31" strokeWidth="1.5"/>
                  <rect x="12" y="1" width="7" height="7" rx="1.5" stroke="#CA8C31" strokeWidth="1.5"/>
                  <rect x="1" y="12" width="7" height="7" rx="1.5" stroke="#CA8C31" strokeWidth="1.5"/>
                  <rect x="12" y="12" width="7" height="7" rx="1.5" stroke="#CA8C31" strokeWidth="1.5"/>
                  <path d="M8 4.5h4M4.5 8v4M15.5 8v4M12 15.5H8" stroke="#CA8C31" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-text-primary">Integración Odoo</h1>
            </div>
            <p className="text-sm text-text-secondary ml-13 pl-0.5">
              Sincronización de inventario entre Odoo ERP y la tienda — vinculado por SKU.
            </p>
          </div>
          <span className={[
            'shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full mt-1',
            configured ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
          ].join(' ')}>
            <StatusDot ok={configured} />
            {configured ? 'Listo para conectar' : 'Configuración incompleta'}
          </span>
        </div>

        {/* ── Grid: Config + Último sync ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Variables de entorno */}
          <section className="bg-surface-2 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Variables de entorno
            </h2>
            {ENV_VARS.map(({ key, label, required }) => (
              <ConfigRow
                key={key}
                label={label}
                configured={!!process.env[key]}
                required={required}
              />
            ))}
          </section>

          {/* Resumen de sync */}
          <section className="bg-surface-2 rounded-2xl p-6 flex flex-col justify-between">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Estado de sincronización
            </h2>

            {lastSync ? (
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Último sync</span>
                  <span className="text-text-primary">{formatDate(lastSync.startedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Estado</span>
                  <span className={[
                    'text-xs font-medium px-2.5 py-1 rounded-full',
                    lastSync.status === 'success' ? 'bg-success/15 text-success'
                    : lastSync.status === 'partial' ? 'bg-warning/15 text-warning'
                    : 'bg-error/15 text-error',
                  ].join(' ')}>
                    {lastSync.status === 'success' ? 'Exitoso'
                     : lastSync.status === 'partial' ? 'Parcial' : 'Error'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Variantes actualizadas</span>
                  <span className="font-medium text-text-primary">{lastSync.itemsSynced}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Duración</span>
                  <span className="text-text-primary">{formatDuration(lastSync.durationMs)}</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center gap-2">
                <p className="text-sm text-text-secondary">Sin sincronizaciones aún</p>
                <p className="text-xs text-text-secondary/60">
                  Usa el botón de abajo para hacer el primer sync.
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border/50 text-xs text-text-secondary flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M6 3.5v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Cron automático: cada hora
            </div>
          </section>
        </div>

        {/* ── Controles interactivos ── */}
        <OdooControls />

        {/* ── Webhook ── */}
        <section className="bg-surface-2 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Webhook — tiempo real
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Configura este endpoint en Odoo para recibir cambios de stock al instante.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-secondary">URL del endpoint</p>
              <code className="block bg-surface rounded-xl px-3 py-2.5 text-xs font-mono text-text-primary break-all border border-border select-all">
                {webhookUrl}
              </code>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-secondary">Header requerido</p>
              <code className="block bg-surface rounded-xl px-3 py-2.5 text-xs font-mono text-text-primary border border-border">
                x-odoo-secret: {'<ODOO_WEBHOOK_SECRET>'}
              </code>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-text-secondary">Payload (JSON)</p>
            <code className="block bg-surface rounded-xl px-4 py-3 text-xs font-mono text-text-primary border border-border whitespace-pre leading-relaxed">
{`// Un solo SKU
{ "sku": "SAV-001-NEG-38", "qty": 5 }

// Varios SKUs
{ "items": [{ "sku": "SAV-001-NEG-38", "qty": 5 }, { "sku": "SAV-002-ROJ-37", "qty": 0 }] }`}
            </code>
          </div>
        </section>

        {/* ── Historial de syncs ── */}
        <section className="bg-surface-2 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Historial de sincronizaciones
          </h2>

          {logs.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-text-secondary">Sin registros todavía.</p>
              <p className="text-xs text-text-secondary/60 mt-1">
                Cada sync (automático o manual) quedará registrado aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs text-text-secondary">
                    <th className="pb-3 font-medium pr-4">Fecha</th>
                    <th className="pb-3 font-medium pr-4">Tipo</th>
                    <th className="pb-3 font-medium pr-4">Estado</th>
                    <th className="pb-3 font-medium text-right pr-4">Actualizadas</th>
                    <th className="pb-3 font-medium text-right pr-4">No encontradas</th>
                    <th className="pb-3 font-medium text-right pr-4">Fallidas</th>
                    <th className="pb-3 font-medium text-right">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr
                      key={log.id}
                      className={[
                        'border-t border-border/50',
                        i === 0 ? 'text-text-primary' : 'text-text-secondary',
                      ].join(' ')}
                    >
                      <td className="py-3 pr-4 text-xs whitespace-nowrap">
                        {formatDate(log.startedAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5">
                          {log.type === 'full_sync' ? 'Cron' : 'Webhook'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={[
                          'text-xs px-2 py-0.5 rounded-full',
                          log.status === 'success' ? 'bg-success/15 text-success'
                          : log.status === 'partial' ? 'bg-warning/15 text-warning'
                          : 'bg-error/15 text-error',
                        ].join(' ')}>
                          {log.status === 'success' ? 'Exitoso'
                           : log.status === 'partial' ? 'Parcial' : 'Error'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-medium">{log.itemsSynced}</td>
                      <td className="py-3 pr-4 text-right">{log.itemsSkipped}</td>
                      <td className="py-3 pr-4 text-right">
                        {log.itemsFailed > 0
                          ? <span className="text-error font-medium">{log.itemsFailed}</span>
                          : <span>0</span>}
                      </td>
                      <td className="py-3 text-right">{formatDuration(log.durationMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
