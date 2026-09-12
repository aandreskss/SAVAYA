// Odoo JSON-RPC v2 client — server-side only, stateless per invocation.
// Docs: https://www.odoo.com/documentation/17.0/developer/reference/external_api.html

export class OdooError extends Error {
  constructor(message: string) {
    super(`[Odoo] ${message}`)
    this.name = 'OdooError'
  }
}

type JsonRpcResult<T> = {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: { code: number; message: string; data?: { name: string; message: string } }
}

export type OdooSession = {
  uid: number
  sessionId: string
}

export type OdooConnectionInfo = {
  connected: boolean
  serverVersion?: string
  database?: string
  username?: string
  error?: string
}

function cfg() {
  return {
    url: process.env.ODOO_URL ?? '',
    db: process.env.ODOO_DB ?? '',
    user: process.env.ODOO_USER ?? '',
    password: process.env.ODOO_PASS ?? '',
  }
}

export function isConfigured(): boolean {
  const { url, db, user, password } = cfg()
  return !!(url && db && user && password)
}

async function jsonRpc<T>(endpoint: string, params: Record<string, unknown>): Promise<T> {
  const { url } = cfg()
  const res = await fetch(`${url}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: Date.now(), params }),
    cache: 'no-store',
  })

  if (!res.ok) throw new OdooError(`HTTP ${res.status} from ${endpoint}`)

  const json: JsonRpcResult<T> = await res.json()
  if (json.error) {
    throw new OdooError(json.error.data?.message ?? json.error.message)
  }
  if (json.result === undefined || json.result === null) {
    throw new OdooError(`Empty result from ${endpoint}`)
  }
  return json.result
}

export async function authenticate(): Promise<OdooSession> {
  const { db, user, password } = cfg()

  if (!isConfigured()) throw new OdooError('Odoo is not configured — check env vars')

  const result = await jsonRpc<{ uid: number; session_id: string } | false>(
    '/web/session/authenticate',
    { db, login: user, password },
  )

  if (!result || !result.uid) throw new OdooError('Invalid credentials or database')

  return { uid: result.uid, sessionId: result.session_id }
}

export async function callKw<T>(
  session: OdooSession,
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`${cfg().url}/web/dataset/call_kw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session_id=${session.sessionId}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      id: Date.now(),
      params: { model, method, args, kwargs },
    }),
    cache: 'no-store',
  })

  if (!res.ok) throw new OdooError(`HTTP ${res.status} calling ${model}.${method}`)

  const json: JsonRpcResult<T> = await res.json()
  if (json.error) throw new OdooError(json.error.data?.message ?? json.error.message)
  return json.result as T
}

export async function testConnection(): Promise<OdooConnectionInfo> {
  try {
    const session = await authenticate()
    const info = await callKw<{ server_version: string }>(
      session,
      'ir.config_parameter',
      'get_param',
      ['web.base.url'],
      {},
    )
    return {
      connected: true,
      serverVersion: undefined, // version requires a separate call
      database: cfg().db,
      username: cfg().user,
    }
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
