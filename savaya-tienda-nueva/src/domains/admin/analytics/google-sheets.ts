import { googleAccessToken, googlePost } from './google-api'
import { reportTables, type GoogleReport } from './google-report-model'

export function spreadsheetBody(report: GoogleReport) {
  return {
    properties: { title: `Savaya · GA4 · ${report.range.from} a ${report.range.to}`, locale: 'es_VE', timeZone: report.timeZone.startsWith('Zona') ? 'America/Caracas' : report.timeZone },
    sheets: reportTables(report).map((table, sheetId) => ({
      properties: { sheetId, title: table.title, gridProperties: { frozenRowCount: 1 } },
      data: [{ startRow: 0, startColumn: 0, rowData: [table.headers, ...table.rows].map((row, index) => ({
        values: row.map(value => ({
          // Explicit stringValue prevents formulas from traffic/product names executing.
          userEnteredValue: typeof value === 'number' ? { numberValue: value } : { stringValue: value },
          ...(index === 0 ? { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.91, green: 0.87, blue: 0.73 } } } : {}),
        })),
      })) }],
    })),
  }
}

export async function createGoogleSheet(report: GoogleReport): Promise<string> {
  const token = await googleAccessToken()
  // A single create writes every tab atomically; no empty orphan if a second write fails.
  const result = await googlePost<{ spreadsheetId: string }>(
    'https://sheets.googleapis.com/v4/spreadsheets', token, spreadsheetBody(report),
  )
  if (!/^[\w-]+$/.test(result.spreadsheetId)) throw new Error('Invalid spreadsheet ID')
  return `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit`
}
