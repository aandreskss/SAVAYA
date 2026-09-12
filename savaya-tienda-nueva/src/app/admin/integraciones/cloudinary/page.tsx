import { requireAdminPermission } from '@/domains/admin/lib/require-permission'
import { listCloudinaryNotifications } from '@/domains/integrations/cloudinary/repository'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function NotificationBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    resource_deleted: 'bg-error/15 text-error',
    upload:           'bg-success/15 text-success',
    eager:            'bg-blue-500/15 text-blue-400',
  }
  const labels: Record<string, string> = {
    resource_deleted: 'Eliminado',
    upload:           'Upload',
    eager:            'Transform',
  }
  const cls = styles[type] ?? 'bg-white/10 text-text-secondary'
  const label = labels[type] ?? type
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

export default async function CloudinaryNotificationsPage() {
  await requireAdminPermission('integrations:manage')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'
  const webhookUrl = `${appUrl}/api/webhooks/cloudinary`
  const isConfigured = !!process.env.CLOUDINARY_API_SECRET

  let notifications: Awaited<ReturnType<typeof listCloudinaryNotifications>> = []
  if (process.env.DATABASE_URL) {
    try { notifications = await listCloudinaryNotifications(200) } catch { /* migration pending */ }
  }

  const deletions = notifications.filter((n) => n.notificationType === 'resource_deleted')
  const total = notifications.length

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold/15 shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M16 13a4 4 0 0 0-3-6.3A5.5 5.5 0 1 0 5.5 14H16a2.5 2.5 0 0 0 0-1Z" stroke="#CA8C31" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 11v3M9 13l1-1 1 1" stroke="#CA8C31" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-0.5">
              <Link href="/admin/integraciones" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Integraciones
              </Link>
              <span className="text-text-secondary">/</span>
              <h1 className="text-2xl font-semibold text-text-primary">Cloudinary · Assets</h1>
            </div>
            <p className="text-sm text-text-secondary">
              Log de notificaciones webhook — últimos 200 eventos registrados.
            </p>
          </div>
        </div>

        {/* Stats + Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Resumen */}
          <section className="bg-surface-2 rounded-2xl p-6 space-y-3">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              Resumen
            </h2>
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/50">
              <span className="text-text-secondary">Total de eventos registrados</span>
              <span className="font-semibold text-text-primary">{total}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-border/50">
              <span className="text-text-secondary">Eliminaciones detectadas</span>
              <span className={`font-semibold ${deletions.length > 0 ? 'text-error' : 'text-success'}`}>
                {deletions.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5">
              <span className="text-text-secondary">Último evento</span>
              <span className="text-text-primary">
                {notifications[0] ? formatDate(notifications[0].receivedAt) : '—'}
              </span>
            </div>
          </section>

          {/* Configuración webhook */}
          <section className="bg-surface-2 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Configuración webhook
            </h2>
            <div>
              <p className="text-xs text-text-secondary mb-1.5">URL del webhook (copiar en Cloudinary)</p>
              <code className="block text-xs bg-white/5 rounded-lg px-3 py-2.5 text-text-primary font-mono break-all">
                {webhookUrl}
              </code>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={[
                'h-2 w-2 rounded-full shrink-0',
                isConfigured ? 'bg-success animate-pulse' : 'bg-warning',
              ].join(' ')} />
              <span className="text-text-secondary">
                Verificación de firma: {' '}
                <span className={isConfigured ? 'text-success' : 'text-warning font-medium'}>
                  {isConfigured ? 'activa (CLOUDINARY_API_SECRET configurado)' : 'desactivada — falta CLOUDINARY_API_SECRET'}
                </span>
              </span>
            </div>
            <div className="text-xs text-text-secondary bg-white/5 rounded-lg p-3 space-y-1">
              <p className="font-medium text-text-primary mb-1">Pasos en Cloudinary:</p>
              <p>1. Settings → Webhook Notifications → Add URL</p>
              <p>2. Pega la URL de arriba</p>
              <p>3. Activa el tipo <span className="font-mono">resource_deleted</span></p>
            </div>
          </section>

        </div>

        {/* Log de eventos */}
        <section className="bg-surface-2 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Log de eventos
            </h2>
            {total > 0 && (
              <span className="text-xs text-text-secondary">{total} registros</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-text-secondary">
                Sin eventos registrados aún. Configura el webhook en Cloudinary para empezar a recibir notificaciones.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Recurso</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Public IDs afectados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {notifications.map((n) => (
                    <tr
                      key={n.id}
                      className={n.notificationType === 'resource_deleted' ? 'bg-error/5' : ''}
                    >
                      <td className="px-6 py-3 text-text-secondary font-mono text-xs whitespace-nowrap">
                        {formatDate(n.receivedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <NotificationBadge type={n.notificationType} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {n.resourceType}
                      </td>
                      <td className="px-4 py-3">
                        {n.publicIds.length === 0 ? (
                          <span className="text-text-secondary text-xs">—</span>
                        ) : (
                          <div className="space-y-0.5">
                            {n.publicIds.map((pid) => (
                              <p key={pid} className="font-mono text-xs text-text-primary break-all">
                                {pid}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
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
