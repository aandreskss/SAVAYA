// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
const mocks = vi.hoisted(() => ({ options: vi.fn(), accessToken: vi.fn() }))
vi.mock('google-auth-library', () => ({ JWT: class {
  constructor(options: unknown) { mocks.options(options) }
  getAccessToken() { return mocks.accessToken() }
} }))
import { googleAccessToken, googleConfigured } from './google-api'
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs() })

// Ephemeral test key, unrelated to any Google account.
const privateKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString().trim()
function configure(key = privateKey) {
  vi.stubEnv('GA4_PROPERTY_ID', '12345')
  vi.stubEnv('GA4_SERVICE_ACCOUNT_EMAIL', ' analytics@project.iam.gserviceaccount.com ')
  vi.stubEnv('GA4_SERVICE_ACCOUNT_PRIVATE_KEY', key)
}
it.each([privateKey, privateKey.replace(/\n/g, '\\n'), JSON.stringify(privateKey), JSON.stringify(privateKey.replace(/\n/g, '\\n'))])('normalizes credential representation %# and requests only read-only analytics access', async key => {
  configure(key)
  mocks.accessToken.mockResolvedValue({ token: 'access-token' })
  expect(await googleAccessToken()).toBe('access-token')
  expect(mocks.options).toHaveBeenCalledWith(expect.objectContaining({
    email: 'analytics@project.iam.gserviceaccount.com', key: privateKey,
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
it('rejects malformed keys before making a network request', async () => {
  configure('a truncated key or a whole JSON object')
  await expect(googleAccessToken()).rejects.toThrow('La clave privada no tiene un formato válido')
  expect(mocks.accessToken).not.toHaveBeenCalled()
})
it('rejects personal email addresses with actionable instructions', async () => {
  configure()
  vi.stubEnv('GA4_SERVICE_ACCOUNT_EMAIL', 'someone@gmail.com')
  await expect(googleAccessToken()).rejects.toThrow('no tu Gmail ni el ID de cliente')
  expect(mocks.accessToken).not.toHaveBeenCalled()
})
it.each([
  ['invalid_grant', 'proceden del mismo archivo JSON'],
  ['invalid_client', 'proceden del mismo archivo JSON'],
  ['disabled_client', 'desactivada o eliminada'],
  ['deleted_client', 'desactivada o eliminada'],
])('maps Google error %s without leaking upstream details', async (error, message) => {
  configure()
  mocks.accessToken.mockRejectedValue({ response: { data: { error, error_description: 'SECRET assertion' } } })
  await expect(googleAccessToken()).rejects.toThrow(message)
})
it('identifies connection timeouts', async () => {
  configure()
  mocks.accessToken.mockRejectedValue({ code: 'ETIMEDOUT' })
  await expect(googleAccessToken()).rejects.toThrow('No se pudo conectar con Google')
})
