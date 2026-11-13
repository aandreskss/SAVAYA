import { requireAdminPermission } from '@/domains/admin/lib/require-permission'
import { googleConfigured, GoogleReportError } from './google-api'
import { getGoogleReport } from './google-report'
import { parseDateRange, todayInCaracas, type GoogleReport } from './google-report-model'
import { GoogleAnalyticsFilters } from './GoogleAnalyticsFilters'
import { GoogleAnalyticsDashboard } from './GoogleAnalyticsDashboard'

export async function GoogleAnalyticsPanel({ from, to }: { from?: string; to?: string }) {
  await requireAdminPermission('analytics:read')
  let report: GoogleReport | undefined
  let error = ''
  let range
  try { range = parseDateRange(from, to) } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Fechas inválidas'
    range = parseDateRange()
  }
  const configured = googleConfigured()
  if (configured && !error) {
    try { report = await getGoogleReport(range) } catch (cause) {
      error = cause instanceof GoogleReportError ? cause.message : 'No se pudo consultar Google Analytics. Intenta de nuevo más tarde.'
    }
  }
  return <section aria-labelledby="ga4-title" className="mb-8 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-[10px] uppercase tracking-[0.22em] text-text-secondary mb-1">Rendimiento de la tienda</p><h2 id="ga4-title" className="font-display text-xl">Google Analytics 4</h2></div>
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${report ? 'border-success/20 bg-success/5 text-success' : 'border-border text-text-secondary'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${report ? 'bg-success' : 'bg-warning'}`} />
        {report ? 'Conectado · solo lectura' : configured ? 'Conexión pendiente de validar' : 'Sin conectar'}
      </span>
    </div>
    <GoogleAnalyticsFilters key={`${range.from}-${range.to}`} range={range} today={todayInCaracas()} />
    {!configured && <div role="status" className="rounded-2xl border border-dashed border-border bg-surface p-8 sm:p-12 text-center">
      <div aria-hidden="true" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-gold/10 text-accent-gold text-2xl">↗</div>
      <h3 className="font-display text-lg mb-2">Tu próxima mirada al crecimiento</h3>
      <p className="mx-auto max-w-md text-sm text-text-secondary">Completa la conexión de la cuenta de servicio para ver audiencia, campañas y compras de Google Analytics aquí.</p>
    </div>}
    {error && <div role="alert" className="rounded-xl border border-error/20 bg-error/5 p-4 text-sm text-error">{error}</div>}
    {report && <>
      <div className="flex flex-wrap justify-between gap-2 text-[11px] text-text-secondary">
        <p>{range.from} — {range.to} · Anterior: {report.previousRange.from} — {report.previousRange.to}</p>
        <p>Consultado {new Date(report.generatedAt).toLocaleString('es-VE', { timeZone: 'America/Caracas', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} (VE) · Caché 5 min</p>
      </div>
      <GoogleAnalyticsDashboard report={report} />
    </>}
  </section>
}
