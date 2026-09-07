import { db } from '@/shared/lib/db'
import { eq, gte, sql, desc, count, countDistinct } from 'drizzle-orm'
import { orderAttributions, pageViews } from './schema'

export type AttributionData = {
  orderId: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  fbc?: string
  fbp?: string
  fbclid?: string
  gclid?: string
}

export async function saveOrderAttribution(data: AttributionData): Promise<void> {
  try {
    await db.insert(orderAttributions).values({
      orderId: data.orderId,
      utmSource: data.utmSource ?? null,
      utmMedium: data.utmMedium ?? null,
      utmCampaign: data.utmCampaign ?? null,
      utmContent: data.utmContent ?? null,
      utmTerm: data.utmTerm ?? null,
      fbc: data.fbc ?? null,
      fbp: data.fbp ?? null,
      fbclid: data.fbclid ?? null,
      gclid: data.gclid ?? null,
    })
  } catch {
    // Attribution failure must never break order creation
  }
}

// ---------------------------------------------------------------------------
// Traffic analytics
// ---------------------------------------------------------------------------

export type TrafficSummary = {
  totalViews: number
  uniqueSessions: number
  topPages: Array<{ path: string; views: number }>
  topCountries: Array<{ country: string; views: number }>
  topReferrers: Array<{ referrer: string; views: number }>
  deviceBreakdown: Array<{ deviceType: string; views: number }>
  browserBreakdown: Array<{ browser: string; views: number }>
  dailyViews: Array<{ date: string; views: number }>
}

export async function getTrafficSummary(days: number = 30): Promise<TrafficSummary> {
  if (!process.env.DATABASE_URL) {
    return {
      totalViews: 0, uniqueSessions: 0, topPages: [], topCountries: [],
      topReferrers: [], deviceBreakdown: [], browserBreakdown: [], dailyViews: [],
    }
  }
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [totals, pages, countries, referrers, devices, browsers, daily] = await Promise.all([
      db
        .select({
          total: count(),
          sessions: countDistinct(pageViews.sessionId),
        })
        .from(pageViews)
        .where(gte(pageViews.createdAt, since)),

      db
        .select({ path: pageViews.path, views: count() })
        .from(pageViews)
        .where(gte(pageViews.createdAt, since))
        .groupBy(pageViews.path)
        .orderBy(desc(count()))
        .limit(10),

      db
        .select({ country: pageViews.country, views: count() })
        .from(pageViews)
        .where(gte(pageViews.createdAt, since))
        .groupBy(pageViews.country)
        .orderBy(desc(count()))
        .limit(10),

      db
        .select({ referrer: pageViews.referrer, views: count() })
        .from(pageViews)
        .where(gte(pageViews.createdAt, since))
        .groupBy(pageViews.referrer)
        .orderBy(desc(count()))
        .limit(10),

      db
        .select({ deviceType: pageViews.deviceType, views: count() })
        .from(pageViews)
        .where(gte(pageViews.createdAt, since))
        .groupBy(pageViews.deviceType)
        .orderBy(desc(count())),

      db
        .select({ browser: pageViews.browser, views: count() })
        .from(pageViews)
        .where(gte(pageViews.createdAt, since))
        .groupBy(pageViews.browser)
        .orderBy(desc(count())),

      db
        .select({
          date: sql<string>`to_char(${pageViews.createdAt} AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD')`,
          views: count(),
        })
        .from(pageViews)
        .where(gte(pageViews.createdAt, since))
        .groupBy(sql`to_char(${pageViews.createdAt} AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${pageViews.createdAt} AT TIME ZONE 'America/Caracas', 'YYYY-MM-DD')`),
    ])

    return {
      totalViews: totals[0]?.total ?? 0,
      uniqueSessions: totals[0]?.sessions ?? 0,
      topPages: pages.map((r) => ({ path: r.path, views: r.views })),
      topCountries: countries
        .filter((r) => r.country)
        .map((r) => ({ country: r.country!, views: r.views })),
      topReferrers: referrers
        .filter((r) => r.referrer)
        .map((r) => ({ referrer: r.referrer!, views: r.views })),
      deviceBreakdown: devices
        .filter((r) => r.deviceType)
        .map((r) => ({ deviceType: r.deviceType!, views: r.views })),
      browserBreakdown: browsers
        .filter((r) => r.browser)
        .map((r) => ({ browser: r.browser!, views: r.views })),
      dailyViews: daily.map((r) => ({ date: r.date, views: r.views })),
    }
  } catch (err) {
    console.error('[analytics/repo] getTrafficSummary failed:', err)
    return {
      totalViews: 0, uniqueSessions: 0, topPages: [], topCountries: [],
      topReferrers: [], deviceBreakdown: [], browserBreakdown: [], dailyViews: [],
    }
  }
}

export async function getOrderAttribution(orderId: string): Promise<AttributionData | null> {
  const [row] = await db
    .select()
    .from(orderAttributions)
    .where(eq(orderAttributions.orderId, orderId))
    .limit(1)

  if (!row) return null
  return {
    orderId: row.orderId,
    utmSource: row.utmSource ?? undefined,
    utmMedium: row.utmMedium ?? undefined,
    utmCampaign: row.utmCampaign ?? undefined,
    fbc: row.fbc ?? undefined,
    fbp: row.fbp ?? undefined,
    fbclid: row.fbclid ?? undefined,
    gclid: row.gclid ?? undefined,
  }
}
