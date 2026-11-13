import { JWT } from 'google-auth-library'

// Imported only by server-side reporting modules. Never expose credentials to clients.
export class GoogleReportError extends Error {
  constructor(message: string, public status = 503) { super(message) }
}

export function googleConfigured(): boolean {
  return /^\d+$/.test(process.env.GA4_PROPERTY_ID ?? '') &&
    !!process.env.GA4_SERVICE_ACCOUNT_EMAIL?.trim() && !!process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY?.trim()
}

export async function googleAccessToken(): Promise<string> {
  if (!googleConfigured()) throw new GoogleReportError('La conexión de informes de Google todavía no está configurada.')
  try {
    const client = new JWT({
      email: process.env.GA4_SERVICE_ACCOUNT_EMAIL!.trim(),
      key: process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY!.trim().replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      transporterOptions: { timeout: 10_000, retry: false },
    })
    const { token } = await client.getAccessToken()
    if (!token) throw new Error('Missing access token')
    return token
  } catch {
    // Library errors may contain the signed assertion; never log or return them.
    throw new GoogleReportError('No se pudo autorizar Google. Revisa el correo y la clave privada de la cuenta de servicio.')
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
