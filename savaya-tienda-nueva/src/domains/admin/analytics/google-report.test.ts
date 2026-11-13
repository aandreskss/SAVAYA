// @vitest-environment node
import { describe, expect, it, vi, afterEach } from 'vitest'
import { parseDateRange, previousDateRange, changeLabel, reportCsv, type GoogleReport } from './google-report-model'
import { spreadsheetBody } from './google-sheets'
import { funnelRequest, funnelTable } from './google-funnel'
import { googleAccessToken, googlePost } from './google-api'

const fixture: GoogleReport = {
  range: { from: '2026-10-01', to: '2026-10-31' }, previousRange: { from: '2026-08-31', to: '2026-09-30' },
  generatedAt: '2026-11-01T12:00:00Z', timeZone: 'America/Caracas', summary: [10, 20, 30, 2, 50.5], previous: [5, 10, 20, 1, 25], warnings: [],
  tables: [{ title: 'Páginas', headers: ['Página', 'Vistas'], rows: [['=IMPORTXML("test")', 3], ['Ruta, con "comillas"', 2]] }],
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('report dates', () => {
  it('uses inclusive equal-length comparison across months and leap days', () => {
    expect(previousDateRange({ from: '2024-03-01', to: '2024-03-01' })).toEqual({ from: '2024-02-29', to: '2024-02-29' })
    expect(previousDateRange(fixture.range)).toEqual(fixture.previousRange)
    expect(parseDateRange(null, null, '2026-11-13')).toEqual({ from: '2026-10-15', to: '2026-11-13' })
  })
  it.each([
    ['2026-02-30', '2026-03-01'], ['2026-11-10', '2026-11-01'],
    ['2026-11-01', '2026-11-14'], ['2024-01-01', '2026-01-01'],
    ['abc', 'today'], ['2026-01-01', ''],
  ])('rejects invalid or excessive range %s %s', (from, to) => {
    expect(() => parseDateRange(from, to, '2026-11-13')).toThrow()
  })
  it('handles no previous data without inventing a percentage', () => {
    expect(changeLabel(2, 0)).toBe('Sin base de comparación')
    expect(changeLabel(0, 0)).toBe('Sin cambios')
    expect(changeLabel(20, 10)).toContain('+100.0%')
  })
})

it('exports actual numeric cells, safe text and date metadata to native Sheets', () => {
  const body = spreadsheetBody(fixture)
  const rows = body.sheets[1].data[0].rowData
  expect(rows[1].values[0].userEnteredValue).toEqual({ stringValue: '=IMPORTXML("test")' })
  expect(rows[1].values[1].userEnteredValue).toEqual({ numberValue: 3 })
  expect(body.sheets.at(-1)?.data[0].rowData.some(row => row.values.some(cell => cell.userEnteredValue.stringValue === '2026-10-01'))).toBe(true)
})

it('escapes CSV formulas, commas and quotes without corrupting numbers', () => {
  const csv = reportCsv(fixture)
  expect(csv).toContain('"\'=IMPORTXML(""test"")"')
  expect(csv).toContain('"Ruta, con ""comillas""","2"')
  expect(csv).toContain('"Ingresos (USD)","50.5","25"')
})

it('requests a closed sequential funnel and parses header order and percentages', () => {
  const request = funnelRequest(fixture.range)
  expect(request.funnel.isOpenFunnel).toBe(false)
  expect(request.funnel.steps.map(step => step.filterExpression.funnelEventFilter.eventName)).toEqual(['page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase'])
  const table = funnelTable({ funnelTable: {
    dimensionHeaders: [{ name: 'funnelStepName' }], metricHeaders: [
      { name: 'funnelStepAbandonments' }, { name: 'activeUsers' }, { name: 'funnelStepAbandonmentRate' }, { name: 'funnelStepCompletionRate' },
    ], rows: [{ dimensionValues: [{ value: '1. Visita' }], metricValues: [{ value: '60' }, { value: '100' }, { value: '0.6' }, { value: '0.4' }] }],
  } })
  expect(table.rows).toEqual([['1. Visita', 100, 40, 60, 60]])
})

it('does not expose Google response bodies or credentials in errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('secret details', { status: 403 })))
  await expect(googlePost('https://sheets.googleapis.com', 'private-token', {})).rejects.toThrow('Revisa los permisos')
  vi.stubEnv('GA4_PROPERTY_ID', '123')
  vi.stubEnv('GOOGLE_REPORTS_CLIENT_ID', 'id')
  vi.stubEnv('GOOGLE_REPORTS_CLIENT_SECRET', 'secret')
  vi.stubEnv('GOOGLE_REPORTS_REFRESH_TOKEN', 'refresh')
  await expect(googleAccessToken()).rejects.toThrow('Revisa la conexión')
})
