import { JWT } from 'google-auth-library'
import { createPrivateKey } from 'node:crypto'

// Imported only by server-side reporting modules. Never expose credentials to clients.
export class GoogleReportError extends Error {
  constructor(message: string, public status = 503) { super(message) }
}

export function googleConfigured(): boolean {
  return /^\d+$/.test(process.env.GA4_PROPERTY_ID ?? '') &&
    !!process.env.GA4_SERVICE_ACCOUNT_EMAIL?.trim() && !!process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY?.trim()
}

function envText(value: string): string {
  const text = value.trim()
  // Also accept a JSON string copied with its surrounding quotes from the key file.
  if (text.startsWith('"') && text.endsWith('"')) {
    try { const parsed: unknown = JSON.parse(text); if (typeof parsed === 'string') return parsed.trim() } catch { /* Validated below. */ }
  }
  return text
}

function serviceAccountCredentials() {
  const email = envText(process.env.GA4_SERVICE_ACCOUNT_EMAIL!)
  if (!/^[^@\s]+@[^@\s]+\.gserviceaccount\.com$/.test(email)) {
    throw new GoogleReportError('El correo de la cuenta de servicio no tiene un formato válido. En Vercel, usa el valor de client_email del archivo JSON, no tu Gmail ni el ID de cliente.')
  }
  const key = envText(process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY!).replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
  try {
    if (createPrivateKey(key).asymmetricKeyType !== 'rsa') throw new Error('Not RSA')
  } catch {
    throw new GoogleReportError('La clave privada no tiene un formato válido. En Vercel, pega el valor completo de private_key, desde BEGIN PRIVATE KEY hasta END PRIVATE KEY, sin el resto del JSON.')
  }
  return { email, key }
}

function authorizationFailure(error: unknown): GoogleReportError {
  if (error instanceof GoogleReportError) return error
  const cause = error as { code?: string; response?: { data?: { error?: string; error_description?: string } } } | null
  const code = cause?.response?.data?.error
  // Match known diagnostics, but never display Google's original response or assertion.
  if (code === 'invalid_grant' || code === 'invalid_client') {
    return new GoogleReportError('Google rechazó las credenciales. Comprueba que client_email y private_key proceden del mismo archivo JSON y que esa clave sigue activa en Google Cloud.')
  }
  if (code === 'disabled_client' || code === 'deleted_client') {
    return new GoogleReportError('La cuenta de servicio o su clave está desactivada o eliminada. Revisa su estado en Google Cloud.')
  }
  if (['ETIMEDOUT', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET'].includes(cause?.code ?? '')) {
    return new GoogleReportError('No se pudo conectar con Google para autorizar la cuenta. Intenta de nuevo en unos minutos.')
  }
  return new GoogleReportError('No se pudo autorizar Google. Revisa el correo y la clave privada de la cuenta de servicio.')
}

export async function googleAccessToken(): Promise<string> {
  if (!googleConfigured()) throw new GoogleReportError('La conexión de informes de Google todavía no está configurada.')
  try {
    const client = new JWT({
      ...serviceAccountCredentials(),
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      transporterOptions: { timeout: 10_000, retry: false },
    })
    const { token } = await client.getAccessToken()
    if (!token) throw new Error('Missing access token')
    return token
  } catch (error) {
    // Library errors may contain the signed assertion; never log or return them.
    throw authorizationFailure(error)
  }
}

export async function googlePost<T>(url: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(20_000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    if (response.status === 429) throw new GoogleReportError('Google alcanzó el límite de consultas. Intenta de nuevo en unos minutos.', 429)
    if (response.status === 401 || response.status === 403) throw new GoogleReportError('Google no permite acceder a estos informes. Revisa los permisos de la cuenta y las APIs habilitadas.')
    throw new GoogleReportError('No se pudo completar el informe de Google. Intenta de nuevo más tarde.')
  }
  return response.json() as Promise<T>
}
