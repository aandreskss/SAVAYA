import { db } from '@/shared/lib/db'
import { exchangeRates } from '@/domains/exchange-rates/schema'
import { applicationSettings } from '@/domains/settings/schema'
import { users } from '@/domains/auth/schema'
import { desc, eq } from 'drizzle-orm'
import type { AdminExchangeRate } from './types'

export async function listRateHistory(limit = 50): Promise<AdminExchangeRate[]> {
  const rows = await db
    .select({
      id: exchangeRates.id,
      currency: exchangeRates.currency,
      rateVes: exchangeRates.rateVes,
      source: exchangeRates.source,
      isManualOverride: exchangeRates.isManualOverride,
      overrideReason: exchangeRates.overrideReason,
      overrideByName: users.name,
      fetchedAt: exchangeRates.fetchedAt,
      createdAt: exchangeRates.createdAt,
    })
    .from(exchangeRates)
    .leftJoin(users, eq(exchangeRates.overrideBy, users.id))
    .orderBy(desc(exchangeRates.createdAt))
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    currency: r.currency as 'usd' | 'eur',
    rateVes: Number(r.rateVes),
    source: r.source,
    isManualOverride: r.isManualOverride,
    overrideReason: r.overrideReason,
    overrideByName: r.overrideByName ?? null,
    fetchedAt: r.fetchedAt,
    createdAt: r.createdAt,
  }))
}

export async function insertManualRate(params: {
  currency: 'usd' | 'eur'
  rateVes: number
  reason: string
  userId: string
}): Promise<AdminExchangeRate> {
  const [row] = await db
    .insert(exchangeRates)
    .values({
      currency: params.currency,
      rateVes: params.rateVes.toFixed(4),
      source: 'manual-override',
      isManualOverride: true,
      overrideReason: params.reason,
      overrideBy: params.userId,
      fetchedAt: new Date(),
    })
    .returning()

  return {
    id: row.id,
    currency: row.currency as 'usd' | 'eur',
    rateVes: Number(row.rateVes),
    source: row.source,
    isManualOverride: row.isManualOverride,
    overrideReason: row.overrideReason,
    overrideByName: null,
    fetchedAt: row.fetchedAt,
    createdAt: row.createdAt,
  }
}

export async function getActiveDisplayRate(): Promise<'usd' | 'eur'> {
  const [row] = await db
    .select({ value: applicationSettings.value })
    .from(applicationSettings)
    .where(eq(applicationSettings.key, 'active_display_rate'))
    .limit(1)
  return row?.value === 'eur' ? 'eur' : 'usd'
}

export async function setActiveDisplayRate(
  currency: 'usd' | 'eur',
  userId: string,
): Promise<void> {
  await db
    .insert(applicationSettings)
    .values({ key: 'active_display_rate', value: currency, updatedBy: userId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: applicationSettings.key,
      set: { value: currency, updatedBy: userId, updatedAt: new Date() },
    })
}
