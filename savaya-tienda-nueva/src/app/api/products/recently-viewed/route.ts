import { NextRequest, NextResponse } from 'next/server'
import { getRecentlyViewedProducts } from '@/domains/catalog/repository'
import { checkRateLimit } from '@/shared/lib/rate-limit'

const MAX_IDS = 8

// ---------------------------------------------------------------------------
// GET /api/products/recently-viewed?ids=uuid1,uuid2,...
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const rl = await checkRateLimit('publicApi', `recently-viewed:${ip}`)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
      },
    )
  }

  const { searchParams } = request.nextUrl
  const raw = searchParams.get('ids')

  if (!raw || raw.trim() === '') {
    return NextResponse.json([])
  }

  const ids = raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .slice(0, MAX_IDS)

  if (ids.length === 0) {
    return NextResponse.json([])
  }

  const products = await getRecentlyViewedProducts(ids)
  return NextResponse.json(products)
}
