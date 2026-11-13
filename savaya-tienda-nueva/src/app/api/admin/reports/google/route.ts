import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/domains/auth/auth'
import { GoogleReportError } from '@/domains/admin/analytics/google-api'
import { getGoogleReport } from '@/domains/admin/analytics/google-report'
import { parseDateRange, reportCsv } from '@/domains/admin/analytics/google-report-model'
import { createGoogleSheet } from '@/domains/admin/analytics/google-sheets'

export const runtime = 'nodejs'
export const maxDuration = 60

async function authorize() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!session.user.permissions?.includes('analytics:read')) return NextResponse.json({ error: 'No tienes permiso para consultar analytics.' }, { status: 403 })
}

function failure(error: unknown) {
  return NextResponse.json({ error: error instanceof GoogleReportError ? error.message : 'No se pudo generar el informe. Intenta de nuevo.' },
    { status: error instanceof GoogleReportError ? error.status : 503 })
}

function dates(req: NextRequest) {
  try { return parseDateRange(req.nextUrl.searchParams.get('from'), req.nextUrl.searchParams.get('to')) }
  catch (error) { throw new GoogleReportError(error instanceof Error ? error.message : 'Fechas inválidas', 400) }
}

export async function GET(req: NextRequest) {
  const denied = await authorize()
  if (denied) return denied
  try {
    const range = dates(req)
    const report = await getGoogleReport(range)
    return new NextResponse(reportCsv(report), { headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="savaya-ga4-${range.from}-${range.to}.csv"`,
      'Cache-Control': 'private, no-store',
    } })
  } catch (error) { return failure(error) }
}

export async function POST(req: NextRequest) {
  const denied = await authorize()
  if (denied) return denied
  if (req.headers.get('origin') !== req.nextUrl.origin || req.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 })
  }
  try {
    const report = await getGoogleReport(dates(req))
    const url = await createGoogleSheet(report)
    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return failure(error) }
}
