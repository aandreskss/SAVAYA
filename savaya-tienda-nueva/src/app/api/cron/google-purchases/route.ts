import { type NextRequest, NextResponse } from 'next/server'
import { retryGooglePurchases } from '@/domains/analytics/google-purchase'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(await retryGooglePurchases())
}
