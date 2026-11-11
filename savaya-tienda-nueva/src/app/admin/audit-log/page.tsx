import { requireAdminPermission } from '@/domains/admin/lib/require-permission'
import { listAuditLogEntries, listDistinctAuditActions } from '@/domains/audit-log/repository'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function ActionBadge({ action }: { action: string }) {
  let cls = 'bg-white/10 text-text-secondary'
  if (action.includes('delete') || action.includes('archive') || action.includes('blocked') || action.includes('rejected')) {
    cls = 'bg-error/15 text-error'
  } else if (action.includes('create') || action.includes('import') || action.includes('activated') || action.includes('approved')) {
    cls = 'bg-success/15 text-success'
  } else if (action.includes('update') || action.includes('publish') || action.includes('transition') || action.includes('movement') || action.includes('reverted')) {
    cls = 'bg-blue-500/15 text-blue-400'
  }
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono ${cls}`}>
      {action}
    </span>
  )
}

function truncateJson(value: unknown): string {
  if (!value) return '—'
  const str = JSON.stringify(value)
  return str.length > 120 ? str.slice(0, 120) + '…' : str
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>
}) {
  await requireAdminPermission('exchange_rates:override')

  const { action: filterAction } = await searchParams

  const [entries, actions] = await Promise.all([
    process.env.DATABASE_URL
      ? listAuditLogEntries({ action: filterAction || undefined, limit: 200 }).catch(() => [])
      : Promise.resolve([]),
    process.env.DATABASE_URL
      ? listDistinctAuditActions().catch(() => [])
      : Promise.resolve([]),
  ])

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold/15 shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M4 4h12v12H4V4Z" stroke="#CA8C31" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M7 8h6M7 11h4" stroke="#CA8C31" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Audit Log</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Últimas 200 acciones del panel administrativo · Solo visible para super admin
            </p>
          </div>
        </div>

        {/* Filter */}
        <form method="GET" className="flex items-center gap-3">
          <label htmlFor="action-filter" className="text-sm text-text-secondary whitespace-nowrap">
            Filtrar por acción:
          </label>
          <select
            id="action-filter"
            name="action"
            defaultValue={filterAction ?? ''}
            className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
          >
            <option value="">Todas las acciones</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-accent-gold text-[#111] text-sm font-semibold hover:bg-accent-gold/90 transition-colors"
          >
            Filtrar
          </button>
          {filterAction && (
            <Link
              href="/admin/audit-log"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Limpiar
            </Link>
          )}
        </form>

        {/* Table */}
        <section className="bg-surface-2 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {filterAction ? `Acción: ${filterAction}` : 'Todas las acciones'}
            </h2>
            <span className="text-xs text-text-secondary">{entries.length} registros</span>
          </div>

          {entries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-text-secondary">Sin registros para esta selección.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">Fecha</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Acción</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">Actor</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Resource ID</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">IP</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Detalle (after)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={
                        entry.action.includes('delete') || entry.action.includes('blocked')
                          ? 'bg-error/[0.03]'
                          : ''
                      }
                    >
                      <td className="px-5 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ActionBadge action={entry.action} />
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                        {entry.actorEmail ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {entry.resourceId
                          ? <span className="truncate block max-w-[180px]" title={entry.resourceId}>{entry.resourceId}</span>
                          : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                        {entry.ip ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-xs">
                        <span title={JSON.stringify(entry.after) ?? ''}>
                          {truncateJson(entry.after)}
                        </span>
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
