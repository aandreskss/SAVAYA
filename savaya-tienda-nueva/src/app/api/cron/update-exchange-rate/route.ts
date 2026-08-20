import { type NextRequest, NextResponse } from 'next/server'
import { refreshRate, refreshEurRate } from '@/domains/exchange-rates/service'

async function handler(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const headerSecret = req.headers.get('x-cron-secret')
  const urlSecret = new URL(req.url).searchParams.get('secret')
  if (headerSecret !== cronSecret && urlSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [usdResult, eurResult] = await Promise.allSettled([refreshRate(), refreshEurRate()])

  const usd =
    usdResult.status === 'fulfilled'
      ? { ok: true, rate: usdResult.value.rateVes, source: usdResult.value.source, fetchedAt: usdResult.value.fetchedAt }
      : { ok: false, error: usdResult.reason instanceof Error ? usdResult.reason.message : 'Unknown error' }

  const eur =
    eurResult.status === 'fulfilled'
      ? { ok: true, rate: eurResult.value.rateVes, source: eurResult.value.source, fetchedAt: eurResult.value.fetchedAt }
      : { ok: false, error: eurResult.reason instanceof Error ? eurResult.reason.message : 'Unknown error' }

  const allOk = usdResult.status === 'fulfilled' && eurResult.status === 'fulfilled'

  return NextResponse.json({ ok: allOk, usd, eur }, { status: allOk ? 200 : 207 })
}

export { handler as GET, handler as POST }
