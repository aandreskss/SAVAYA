import { type NextRequest, NextResponse } from 'next/server'
import { searchProvider } from '@/domains/catalog/search'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import { z } from 'zod'

const QuerySchema = z.object({
  q: z.string().min(2).max(100),
})

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await checkRateLimit('search', `search:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.safeParse({ q: searchParams.get('q') })
  if (!parsed.success) {
    return NextResponse.json({ results: [] })
  }

  // Fallback si no hay DB configurada (dev sin DATABASE_URL)
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      results: [
        { type: 'product', id: '1', name: 'Sandalia Punta Fina', slug: 'sandalia-punta-fina', price: 45, currency: 'USD' },
        { type: 'category', id: '2', name: 'Sandalias', slug: 'sandalias', currency: 'USD' },
      ],
    })
  }

  const results = await searchProvider.search(parsed.data.q)
  return NextResponse.json({ results })
}
