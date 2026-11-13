export type DateRange = { from: string; to: string }
export type ReportTable = { title: string; headers: string[]; rows: (string | number)[][]; totalRows?: number }
export type GoogleReport = {
  range: DateRange
  previousRange: DateRange
  generatedAt: string
  timeZone: string
  warnings: string[]
  summary: number[]
  previous: number[]
  tables: ReportTable[]
}

export const SUMMARY_LABELS = ['Usuarios activos', 'Sesiones', 'Vistas de página', 'Compras', 'Ingresos (USD)']
const DAY = 86_400_000

export function todayInCaracas(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

export function parseDateRange(from?: string | null, to?: string | null, today = todayInCaracas()): DateRange {
  const end = to ?? today
  if (!validDate(end)) throw new Error('Selecciona una fecha final válida.')
  const start = from ?? new Date(Date.parse(end) - 29 * DAY).toISOString().slice(0, 10)
  if (!validDate(start) || !validDate(end) || start > end || end > today) throw new Error('Selecciona fechas válidas, en orden y sin días futuros.')
  if ((Date.parse(end) - Date.parse(start)) / DAY >= 366) throw new Error('Selecciona un período máximo de 366 días.')
  return { from: start, to: end }
}

export function previousDateRange(range: DateRange): DateRange {
  const days = (Date.parse(range.to) - Date.parse(range.from)) / DAY + 1
  return {
    from: new Date(Date.parse(range.from) - days * DAY).toISOString().slice(0, 10),
    to: new Date(Date.parse(range.from) - DAY).toISOString().slice(0, 10),
  }
}

export function changeLabel(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? 'Sin cambios' : 'Sin base de comparación'
  const change = (current - previous) / previous * 100
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs. período anterior`
}

export function reportTables(report: GoogleReport): ReportTable[] {
  return [
    { title: 'Resumen', headers: ['Métrica', 'Actual', 'Anterior'], rows: SUMMARY_LABELS.map((label, i) => [label, report.summary[i] ?? 0, report.previous[i] ?? 0]) },
    ...report.tables,
    { title: 'Información', headers: ['Campo', 'Valor'], rows: [
      ['Desde', report.range.from], ['Hasta', report.range.to],
      ['Anterior desde', report.previousRange.from], ['Anterior hasta', report.previousRange.to],
      ['Zona horaria GA4', report.timeZone], ['Moneda', 'USD'], ['Consultado', report.generatedAt],
      ['Alcance', 'Desgloses: hasta 50 filas principales. Etapas: eventos independientes, no embudo secuencial.'],
      ['Embudo', 'Cerrado: visita → producto → carrito → checkout → compra. Usuarios en orden dentro del período, con eventos intermedios y distintas sesiones.'],
      ...report.warnings.map((warning): (string | number)[] => ['Aviso', warning]),
    ] },
  ]
}

export function reportCsv(report: GoogleReport): string {
  const cell = (value: string | number) => {
    let text = String(value)
    // Traffic dimensions are user controlled; prevent spreadsheet formula injection.
    if (typeof value === 'string' && /^[\s]*[=+@\-]/.test(text)) text = `'${text}`
    return `"${text.replace(/"/g, '""')}"`
  }
  return '\uFEFF' + reportTables(report).map(table => [
    [table.title], table.headers, ...table.rows,
  ].map(row => row.map(cell).join(',')).join('\r\n')).join('\r\n\r\n')
}
