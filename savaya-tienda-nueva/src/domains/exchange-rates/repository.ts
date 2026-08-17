import { db } from '@/shared/lib/db'
import { exchangeRates } from './schema'
import { desc, eq } from 'drizzle-orm'

export type StoredRate = {
  id: string
  currency: 'usd' | 'eur'
  rateVes: number
  source: string
  isManualOverride: boolean
  fetchedAt: Date
}

export async function getLatestRate(currency: 'usd' | 'eur' = 'usd'): Promise<StoredRate | null> {
  const [row] = await db
    .select()
    .from(exchangeRates)
    .where(eq(exchangeRates.currency, currency))
    .orderBy(desc(exchangeRates.createdAt))
    .limit(1)

  if (!row) return null

  return {
    id: row.id,
    currency: row.currency,
    rateVes: Number(row.rateVes),
    source: row.source,
    isManualOverride: row.isManualOverride ?? false,
    fetchedAt: row.fetchedAt,
  }
}

export async function saveRate(data: {
  currency: 'usd' | 'eur'
  rateVes: number
  source: string
  isManualOverride?: boolean
  overrideReason?: string
  overrideBy?: string
  fetchedAt?: Date
}): Promise<void> {
  await db.insert(exchangeRates).values({
    currency: data.currency,
    rateVes: data.rateVes.toFixed(4),
    source: data.source,
    isManualOverride: data.isManualOverride ?? false,
    overrideReason: data.overrideReason ?? null,
    overrideBy: data.overrideBy ?? null,
    fetchedAt: data.fetchedAt ?? new Date(),
  })
}
