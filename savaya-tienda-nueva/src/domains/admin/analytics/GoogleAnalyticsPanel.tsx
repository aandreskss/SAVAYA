import { requireAdminPermission } from '@/domains/admin/lib/require-permission'
import { googleConfigured, GoogleReportError } from './google-api'
import { getGoogleReport } from './google-report'
import { changeLabel, parseDateRange, SUMMARY_LABELS, todayInCaracas, type GoogleReport } from './google-report-model'
import { GoogleReportExport } from './GoogleReportExport'

const number = new Intl.NumberFormat('es-VE', { maximumFractionDigits: 2 })
const money = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' })

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
  return <section aria-labelledby="ga4-title" className="mt-8 mb-8 space-y-5">
    <div><h2 id="ga4-title" className="font-display text-2xl">Google Analytics 4</h2>
      <p className="text-sm text-text-secondary mt-1">Informe de audiencia, adquisición y comercio electrónico.</p></div>
    <form action="/admin/analytics" method="get" className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-text-secondary">Desde
        <input name="from" type="date" required defaultValue={from ?? range.from} max={todayInCaracas()} className="block mt-1 px-3 py-2 rounded border border-border bg-surface text-text-primary" />
      </label>
      <label className="text-xs text-text-secondary">Hasta
        <input name="to" type="date" required defaultValue={to ?? range.to} max={todayInCaracas()} className="block mt-1 px-3 py-2 rounded border border-border bg-surface text-text-primary" />
      </label>
      <button className="px-4 py-2 rounded border border-border text-sm">Consultar período</button>
    </form>
    {!configured && <div role="status" className="bg-surface border border-border rounded-xl p-5 text-sm text-text-secondary">Los informes de Google aún no están conectados. Solicita al administrador que complete la conexión para consultar datos y crear Google Sheets.</div>}
    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
    {report && <>
      <p className="text-xs text-text-muted">{range.from} al {range.to} · Comparación: {report.previousRange.from} al {report.previousRange.to} · Zona horaria: {report.timeZone}</p>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {SUMMARY_LABELS.map((label, index) => <div key={label} className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-text-secondary">{label}</p>
          <p className="font-display text-2xl mt-2">{index === 4 ? money.format(report.summary[index]) : number.format(report.summary[index])}</p>
          <p className="text-xs text-text-muted mt-2">{changeLabel(report.summary[index], report.previous[index])}</p>
        </div>)}
      </div>
      <div className="text-xs text-text-secondary space-y-1">
        <p>Datos de GA4, sujetos al consentimiento, bloqueadores y procesamiento de Google. Pueden diferir de las ventas internas. El período actual puede estar incompleto.</p>
        <p>Etapas de compra muestra eventos independientes; no representa un embudo secuencial ni tasas de abandono.</p>
        <p>El embudo de compra cuenta usuarios que completan los pasos en orden dentro del período, admitiendo eventos intermedios y distintas sesiones.</p>
        <p>Consultado: {new Date(report.generatedAt).toLocaleString('es-VE', { timeZone: 'America/Caracas' })} (Venezuela). Caché de 5 minutos. Desgloses: hasta 50 filas principales.</p>
        {report.warnings.map(warning => <p key={warning}>{warning}</p>)}
      </div>
      <GoogleReportExport key={`${range.from}-${range.to}`} range={range} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {report.tables.map(table => <div key={table.title} className={`bg-surface border border-border rounded-xl p-5 min-w-0 ${table.title === 'Evolución diaria' ? 'lg:col-span-2' : ''}`}>
          <h3 className="text-sm font-medium mb-3">{table.title}</h3>
          {table.rows.length === 0 ? <p className="text-xs text-text-muted">Sin datos para este período.</p> : <div className="overflow-auto max-h-80">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-surface"><tr>{table.headers.map(header => <th key={header} scope="col" className="px-2 py-2 font-medium text-text-secondary whitespace-nowrap">{header}</th>)}</tr></thead>
              <tbody>{table.rows.map((row, i) => <tr key={i} className="border-t border-border">{row.map((value, j) => <td key={j} className="px-2 py-2 max-w-64 break-words">{typeof value === 'number' ? number.format(value) : value}</td>)}</tr>)}</tbody>
            </table>
          </div>}
        </div>)}
      </div>
    </>}
  </section>
}
