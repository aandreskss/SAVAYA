import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/lib/db'
import { pageViews } from '@/domains/analytics/schema'

function parseDevice(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobi|android|iphone|ipod|blackberry|opera mini|windows phone/i.test(ua)) return 'mobile'
  return 'desktop'
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) return 'Chrome'
  if (/firefox\//i.test(ua)) return 'Firefox'
  if (/safari\//i.test(ua)) return 'Safari'
  return 'Otro'
}

function parseOS(ua: string): string {
  if (/windows nt/i.test(ua)) return 'Windows'
  if (/mac os x/i.test(ua)) return 'macOS'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Otro'
}

function isBot(ua: string): boolean {
  return /bot|crawler|spider|prerender|headless|puppet|selenium|playwright|lighthouse|googlebot|bingbot|facebookexternalhit/i.test(ua)
}

function extractReferrerDomain(referrer: string | null): string | null {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ua = req.headers.get('user-agent') ?? ''
    if (isBot(ua)) return NextResponse.json({ ok: true })

    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const path = typeof body.path === 'string' ? body.path.slice(0, 500) : '/'
    const referrer = extractReferrerDomain(typeof body.referrer === 'string' ? body.referrer : null)
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null

    const country = req.headers.get('x-vercel-ip-country')
    const city = req.headers.get('x-vercel-ip-city')

    await db.insert(pageViews).values({
      path,
      referrer,
      sessionId,
      country,
      city,
      deviceType: parseDevice(ua),
      browser: parseBrowser(ua),
      os: parseOS(ua),
    })
  } catch (err) {
    // Tracking must never break the site — but log so we can diagnose
    console.error('[track/pv] insert failed:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ ok: true })
}
