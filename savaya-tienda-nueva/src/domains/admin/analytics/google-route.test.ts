// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ auth: vi.fn(), report: vi.fn(), sheets: vi.fn() }))
vi.mock('@/domains/auth/auth', () => ({ auth: mocks.auth }))
vi.mock('./google-report', () => ({ getGoogleReport: mocks.report }))
vi.mock('./google-sheets', () => ({ createGoogleSheet: mocks.sheets }))
import { GET, POST } from '@/app/api/admin/reports/google/route'

afterEach(() => vi.resetAllMocks())
const url = 'https://savaya.test/api/admin/reports/google?from=2026-01-01&to=2026-01-31'
function analyst() { mocks.auth.mockResolvedValue({ user: { id: 'analyst', permissions: ['analytics:read'] } }) }

it('blocks anonymous and authenticated users without analytics permission', async () => {
  mocks.auth.mockResolvedValue(null)
  expect((await GET(new NextRequest(url))).status).toBe(401)
  mocks.auth.mockResolvedValue({ user: { id: 'sales', permissions: ['orders:read'] } })
  expect((await POST(new NextRequest(url, { method: 'POST' }))).status).toBe(403)
  expect(mocks.report).not.toHaveBeenCalled()
  expect(mocks.sheets).not.toHaveBeenCalled()
})
it('blocks cross-origin spreadsheet creation', async () => {
  analyst()
  expect((await POST(new NextRequest(url, { method: 'POST', headers: { origin: 'https://other.test' } }))).status).toBe(403)
  expect(mocks.sheets).not.toHaveBeenCalled()
})
it('rejects invalid dates before querying Google', async () => {
  analyst()
  expect((await GET(new NextRequest(url.replace('2026-01-31', 'invalid')))).status).toBe(400)
  expect(mocks.report).not.toHaveBeenCalled()
})
it('creates a Google Sheet for the authorized selected period', async () => {
  analyst()
  mocks.report.mockResolvedValue({ report: true })
  mocks.sheets.mockResolvedValue('https://docs.google.com/spreadsheets/d/test/edit')
  const response = await POST(new NextRequest(url, { method: 'POST', headers: { origin: 'https://savaya.test' } }))
  expect(response.status).toBe(200)
  expect(mocks.report).toHaveBeenCalledWith({ from: '2026-01-01', to: '2026-01-31' })
  expect(mocks.sheets).toHaveBeenCalledWith({ report: true })
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
})
