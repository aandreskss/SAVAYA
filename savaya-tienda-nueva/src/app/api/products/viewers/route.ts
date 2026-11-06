import { type NextRequest, NextResponse } from 'next/server'
import { getProductViewerCount } from '@/domains/analytics/repository'
import { checkRateLimit } from '@/shared/lib/rate-limit'

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = await checkRateLimit('publicApi', ip)
  if (!rl.success) return NextResponse.json({ count: 0 })

  const slug = req.nextUrl.searchParams.get('slug')
  const gender = req.nextUrl.searchParams.get('gender') ?? 'unisex'
  if (!slug) return NextResponse.json({ count: 0 })

  const count = await getProductViewerCount(slug, gender)
  return NextResponse.json(
    { count },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
