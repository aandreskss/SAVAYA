import { type NextRequest, NextResponse } from 'next/server'
import { getProductViewerCount } from '@/domains/analytics/repository'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ count: 0 })

  const count = await getProductViewerCount(slug)
  return NextResponse.json(
    { count },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
