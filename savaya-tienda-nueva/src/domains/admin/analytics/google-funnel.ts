import { googlePost } from './google-api'
import type { DateRange, ReportTable } from './google-report-model'

const STEPS = [
  ['Visita', 'page_view'], ['Producto visto', 'view_item'], ['Carrito', 'add_to_cart'],
  ['Checkout', 'begin_checkout'], ['Compra', 'purchase'],
]

export function funnelRequest(range: DateRange) {
  return {
    dateRanges: [{ startDate: range.from, endDate: range.to }],
    funnel: { isOpenFunnel: false, steps: STEPS.map(([name, eventName]) => ({
      name, isDirectlyFollowedBy: false, filterExpression: { funnelEventFilter: { eventName } },
    })) },
    limit: 50,
  }
}

type FunnelResponse = { funnelTable?: {
  dimensionHeaders: { name: string }[]; metricHeaders: { name: string }[]
  rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[]
  metadata?: { samplingMetadatas?: unknown[] }
} }

export function funnelTable(response: FunnelResponse): ReportTable {
  const source = response.funnelTable
  if (!source) throw new Error('Missing funnel report')
  const stepIndex = source.dimensionHeaders.findIndex(header => header.name === 'funnelStepName')
  const metricNames = ['activeUsers', 'funnelStepCompletionRate', 'funnelStepAbandonments', 'funnelStepAbandonmentRate']
  const indices = metricNames.map(name => source.metricHeaders.findIndex(header => header.name === name))
  if (stepIndex < 0 || indices.some(index => index < 0)) throw new Error('Invalid funnel columns')
  return {
    title: 'Embudo de compra', headers: ['Paso', 'Usuarios activos', 'Avance al siguiente paso (%)', 'Abandonos', 'Abandono (%)'],
    rows: (source.rows ?? []).map(row => [row.dimensionValues[stepIndex].value,
      ...indices.map((index, position) => {
        const value = Number(row.metricValues[index].value)
        return Number.isFinite(value) ? value * (position === 1 || position === 3 ? 100 : 1) : 0
      }),
    ]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  }
}

export async function loadFunnel(property: string, token: string, range: DateRange) {
  const response = await googlePost<FunnelResponse>(`https://analyticsdata.googleapis.com/v1alpha/properties/${property}:runFunnelReport`, token, funnelRequest(range))
  return { table: funnelTable(response), sampled: !!response.funnelTable?.metadata?.samplingMetadatas?.length }
}
