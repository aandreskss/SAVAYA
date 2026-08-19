import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/domains/auth/auth'

async function fetchRaw(url: string): Promise<{ status: number; body: unknown; error?: string }> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    const text = await res.text()
    let body: unknown
    try { body = JSON.parse(text) } catch { body = text }
    return { status: res.status, body }
  } catch (e) {
    return { status: 0, body: null, error: String(e) }
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [dolarapiList, dolarapiEuro, pydolarveEur, pydolarveUsd] = await Promise.all([
    fetchRaw('https://ve.dolarapi.com/v1/dolares'),
    fetchRaw('https://ve.dolarapi.com/v1/dolares/euro'),
    fetchRaw('https://pydolarve.org/api/v1/euro?page=bcv'),
    fetchRaw('https://pydolarve.org/api/v1/dollar?page=bcv'), // control: this one works
  ])

  return NextResponse.json({
    'dolarapi /v1/dolares': dolarapiList,
    'dolarapi /v1/dolares/euro': dolarapiEuro,
    'pydolarve /euro?page=bcv': pydolarveEur,
    'pydolarve /dollar?page=bcv (control)': pydolarveUsd,
  })
}
