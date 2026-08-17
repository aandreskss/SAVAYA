import { db } from '@/shared/lib/db'
import { eq } from 'drizzle-orm'
import { orderAttributions } from './schema'

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
