import { type NextRequest, NextResponse } from 'next/server'
import { getProductViewerCount } from '@/domains/analytics/repository'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const gender = req.nextUrl.searchParams.get('gender') ?? 'unisex'
  if (!slug) return NextResponse.json({ count: 0 })

  const count = await getProductViewerCount(slug, gender)
  return NextResponse.json(
    { count },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
