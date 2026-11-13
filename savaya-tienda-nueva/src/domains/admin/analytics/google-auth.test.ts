// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ options: vi.fn(), accessToken: vi.fn() }))
vi.mock('google-auth-library', () => ({ JWT: class {
  constructor(options: unknown) { mocks.options(options) }
  getAccessToken() { return mocks.accessToken() }
} }))
import { googleAccessToken, googleConfigured } from './google-api'
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs() })

function configure(key = '-----BEGIN PRIVATE KEY-----\\nfake\\n-----END PRIVATE KEY-----') {
  vi.stubEnv('GA4_PROPERTY_ID', '12345')
  vi.stubEnv('GA4_SERVICE_ACCOUNT_EMAIL', ' analytics@project.iam.gserviceaccount.com ')
  vi.stubEnv('GA4_SERVICE_ACCOUNT_PRIVATE_KEY', key)
}
it.each(['-----BEGIN PRIVATE KEY-----\\nfake\\n-----END PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----'])('normalizes the key and requests only read-only analytics access', async key => {
  configure(key)
  mocks.accessToken.mockResolvedValue({ token: 'access-token' })
  expect(await googleAccessToken()).toBe('access-token')
  expect(mocks.options).toHaveBeenCalledWith(expect.objectContaining({
    email: 'analytics@project.iam.gserviceaccount.com', key: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  }))
})
it('rejects OAuth-only configuration and missing service account credentials', async () => {
  configure()
  vi.stubEnv('GA4_SERVICE_ACCOUNT_PRIVATE_KEY', '')
  vi.stubEnv('GOOGLE_REPORTS_REFRESH_TOKEN', 'old-token')
  expect(googleConfigured()).toBe(false)
  await expect(googleAccessToken()).rejects.toThrow('no está configurada')
  expect(mocks.options).not.toHaveBeenCalled()
})
it('hides credential-bearing library failures and empty tokens', async () => {
  configure()
  mocks.accessToken.mockRejectedValueOnce(new Error('private signed assertion SECRET'))
  await expect(googleAccessToken()).rejects.toThrow('Revisa el correo y la clave privada')
  mocks.accessToken.mockResolvedValueOnce({ token: null })
  await expect(googleAccessToken()).rejects.toThrow('Revisa el correo y la clave privada')
})
