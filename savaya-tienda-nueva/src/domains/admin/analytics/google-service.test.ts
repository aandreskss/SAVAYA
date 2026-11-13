// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ token: vi.fn(), post: vi.fn(), configured: vi.fn(), funnel: vi.fn() }))
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock('./google-api', async importOriginal => ({
  ...await importOriginal<typeof import('./google-api')>(),
  googleAccessToken: mocks.token, googlePost: mocks.post, googleConfigured: mocks.configured,
}))
vi.mock('./google-funnel', () => ({ loadFunnel: mocks.funnel }))
import { getGoogleReport } from './google-report'

afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs() })

it('uses real totals, independent prior totals and preserves report warnings when the funnel is unavailable', async () => {
  vi.stubEnv('GA4_PROPERTY_ID', '12345')
  mocks.configured.mockReturnValue(true)
  mocks.token.mockResolvedValue('token')
  mocks.funnel.mockRejectedValue(new Error('alpha unavailable'))
  const rows = [{ metricValues: [100, 200, 300, 4, 60].map(value => ({ value: String(value) })) }]
  mocks.post.mockResolvedValueOnce({ rows, metadata: { timeZone: 'America/Caracas', subjectToThresholding: true } })
    .mockResolvedValueOnce({ rows: [{ metricValues: [50, 80, 90, 2, 30].map(value => ({ value: String(value) })) }] })
    .mockResolvedValue({ rows: [], rowCount: 0 })
  const report = await getGoogleReport({ from: '2026-10-01', to: '2026-10-31' })
  expect(report.summary).toEqual([100, 200, 300, 4, 60])
  expect(report.previous).toEqual([50, 80, 90, 2, 30])
  expect(report.previousRange).toEqual({ from: '2026-08-31', to: '2026-09-30' })
  expect(report.tables.at(-1)?.rows).toContainEqual(['purchase', 0, 0])
  expect(report.warnings.join(' ')).toContain('umbrales')
  expect(report.warnings.join(' ')).toContain('embudo secuencial no está disponible')
  expect(mocks.post.mock.calls.every(call => call[0].includes('/properties/12345:runReport'))).toBe(true)
  expect(mocks.post.mock.calls[1][2].dateRanges).toEqual([{ startDate: '2026-08-31', endDate: '2026-09-30' }])
})

it('does not fetch Google data when no reporting connection exists', async () => {
  mocks.configured.mockReturnValue(false)
  await expect(getGoogleReport({ from: '2026-10-01', to: '2026-10-31' })).rejects.toThrow('no está configurada')
  expect(mocks.post).not.toHaveBeenCalled()
})
