import { unstable_cache } from 'next/cache'
import { googleAccessToken, googleConfigured, googlePost, GoogleReportError } from './google-api'
import { previousDateRange, type DateRange, type GoogleReport, type ReportTable } from './google-report-model'
import { loadFunnel } from './google-funnel'

type Row = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }
type Response = {
  rows?: Row[]; rowCount?: number
  metadata?: { timeZone?: string; subjectToThresholding?: boolean; dataLossFromOtherRow?: boolean; samplingMetadatas?: unknown[] }
}
type Spec = { title: string; dimensions: string[]; metrics: string[]; headers: string[]; order?: string; events?: string[] }

export const REPORT_SPECS: Spec[] = [
  { title: 'Evolución diaria', dimensions: ['date'], metrics: ['activeUsers', 'sessions', 'screenPageViews', 'ecommercePurchases', 'purchaseRevenue'], headers: ['Fecha', 'Usuarios activos', 'Sesiones', 'Vistas', 'Compras', 'Ingresos USD'], order: 'date' },
  { title: 'Fuentes y campañas', dimensions: ['sessionSourceMedium', 'sessionCampaignName'], metrics: ['sessions', 'engagedSessions', 'ecommercePurchases', 'purchaseRevenue'], headers: ['Fuente / medio', 'Campaña', 'Sesiones', 'Sesiones con interacción', 'Compras', 'Ingresos USD'] },
  { title: 'Páginas más vistas', dimensions: ['pagePath'], metrics: ['screenPageViews', 'activeUsers'], headers: ['Página', 'Vistas', 'Usuarios activos'] },
  { title: 'Dispositivos', dimensions: ['deviceCategory'], metrics: ['sessions', 'ecommercePurchases', 'purchaseRevenue'], headers: ['Dispositivo', 'Sesiones', 'Compras', 'Ingresos USD'] },
  { title: 'Productos más vistos', dimensions: ['itemName', 'itemId'], metrics: ['itemsViewed', 'itemsAddedToCart', 'itemsPurchased', 'itemRevenue'], headers: ['Producto', 'ID', 'Unidades vistas', 'Unidades al carrito', 'Unidades compradas', 'Ingresos USD'] },
  { title: 'Etapas de compra', dimensions: ['eventName'], metrics: ['eventCount', 'totalUsers'], headers: ['Evento', 'Veces registrado', 'Usuarios'], events: ['page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase'] },
]

export function reportRequest(range: DateRange, spec: Spec) {
  return {
    dateRanges: [{ startDate: range.from, endDate: range.to }], currencyCode: 'USD',
    dimensions: spec.dimensions.map(name => ({ name })), metrics: spec.metrics.map(name => ({ name })),
    limit: spec.order === 'date' ? 366 : 50,
    orderBys: spec.order ? [{ dimension: { dimensionName: spec.order } }] : [{ metric: { metricName: spec.metrics[0] }, desc: true }],
    ...(spec.events ? { dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: spec.events } } } } : {}),
  }
}

function metrics(row?: Row): number[] {
  return (row?.metricValues ?? []).map(value => {
    const number = Number(value.value)
    return Number.isFinite(number) ? number : 0
  })
}

async function loadReport(property: string, range: DateRange): Promise<GoogleReport> {
  const token = await googleAccessToken()
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`
  const previousRange = previousDateRange(range)
  // The alpha funnel endpoint may be unavailable independently of core reports.
  const funnelPromise = loadFunnel(property, token, range).catch(() => null)
  const summarySpec: Spec = { title: 'Resumen', dimensions: [], metrics: ['activeUsers', 'sessions', 'screenPageViews', 'ecommercePurchases', 'purchaseRevenue'], headers: [] }
  const responses = await Promise.all([
    googlePost<Response>(endpoint, token, reportRequest(range, summarySpec)),
    googlePost<Response>(endpoint, token, reportRequest(previousRange, summarySpec)),
    ...REPORT_SPECS.map(spec => googlePost<Response>(endpoint, token, reportRequest(range, spec))),
  ])
  const warnings = new Set<string>()
  for (const response of responses) {
    if (response.metadata?.subjectToThresholding) warnings.add('Google aplica umbrales de privacidad a parte de los datos.')
    if (response.metadata?.dataLossFromOtherRow) warnings.add('Google agrupa parte de los datos en la fila «(other)».')
    if (response.metadata?.samplingMetadatas?.length) warnings.add('Parte de los resultados de Google se basa en datos muestreados.')
  }
  const tables: ReportTable[] = REPORT_SPECS.map((spec, i) => {
    const response = responses[i + 2]
    if ((response.rowCount ?? 0) > 50 && spec.order !== 'date') warnings.add(`${spec.title}: se muestran las 50 filas principales de ${response.rowCount}.`)
    return {
      title: spec.title, headers: spec.headers, totalRows: response.rowCount ?? 0,
      rows: (response.rows ?? []).map(row => [
        ...(row.dimensionValues ?? []).map((value, index) => spec.dimensions[index] === 'date'
          ? value.value.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3') : value.value),
        ...metrics(row),
      ]),
    }
  })
  // Event counts describe independent stages; do not imply a sequential funnel.
  const stages = tables[tables.length - 1]
  stages.rows = REPORT_SPECS[REPORT_SPECS.length - 1].events!.map(event => stages.rows.find(row => row[0] === event) ?? [event, 0, 0])
  const funnel = await funnelPromise
  if (funnel) {
    tables.push(funnel.table)
    if (funnel.sampled) warnings.add('El embudo de compra utiliza datos muestreados por Google.')
  } else warnings.add('El embudo secuencial no está disponible en Google en este momento. Las etapas independientes siguen disponibles.')
  return {
    range, previousRange, generatedAt: new Date().toISOString(),
    timeZone: responses[0].metadata?.timeZone ?? 'Zona horaria de la propiedad GA4',
    summary: responses[0].rows?.length ? metrics(responses[0].rows[0]) : [0, 0, 0, 0, 0],
    previous: responses[1].rows?.length ? metrics(responses[1].rows[0]) : [0, 0, 0, 0, 0],
    tables, warnings: [...warnings],
  }
}

const cachedReport = unstable_cache(loadReport, ['ga4-admin-report-v2'], { revalidate: 300 })

export async function getGoogleReport(range: DateRange): Promise<GoogleReport> {
  if (!googleConfigured()) throw new GoogleReportError('La conexión de informes de Google todavía no está configurada.')
  return cachedReport(process.env.GA4_PROPERTY_ID!, range)
}
