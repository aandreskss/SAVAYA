import { type NextRequest, NextResponse } from 'next/server'
import { refreshRate } from '@/domains/exchange-rates/service'

async function handler(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const headerSecret = req.headers.get('x-cron-secret')
  const urlSecret = new URL(req.url).searchParams.get('secret')
  if (headerSecret !== cronSecret && urlSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rate = await refreshRate()
    return NextResponse.json({
      ok: true,
      rate: rate.rateVes,
      source: rate.source,
      fetchedAt: rate.fetchedAt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export { handler as GET, handler as POST }
