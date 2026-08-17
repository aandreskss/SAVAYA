import { type NextRequest, NextResponse } from 'next/server'
import { refreshRate } from '@/domains/exchange-rates/service'

async function handler(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
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
