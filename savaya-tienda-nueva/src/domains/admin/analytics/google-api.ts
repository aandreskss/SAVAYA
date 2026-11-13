// Imported only by server-side reporting modules. Never expose credentials to clients.
export class GoogleReportError extends Error {
  constructor(message: string, public status = 503) { super(message) }
}

export function googleConfigured(): boolean {
  return /^\d+$/.test(process.env.GA4_PROPERTY_ID ?? '') && !!process.env.GOOGLE_REPORTS_CLIENT_ID &&
    !!process.env.GOOGLE_REPORTS_CLIENT_SECRET && !!process.env.GOOGLE_REPORTS_REFRESH_TOKEN
}

export async function googleAccessToken(): Promise<string> {
  if (!googleConfigured()) throw new GoogleReportError('La conexión de informes de Google todavía no está configurada.')
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(10_000),
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_REPORTS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_REPORTS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REPORTS_REFRESH_TOKEN!, grant_type: 'refresh_token',
    }),
  })
  if (!response.ok) throw new GoogleReportError('No se pudo autorizar Google. Revisa la conexión de la cuenta de informes.')
  const data = await response.json()
  if (typeof data.access_token !== 'string') throw new GoogleReportError('Google no devolvió una autorización válida.')
  return data.access_token
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
