import 'server-only'
import { db } from '@/shared/lib/db'
import { eq } from 'drizzle-orm'
import { applicationSettings } from '@/domains/settings/schema'
import { getLatestRate, saveRate } from './repository'
export type { ExchangeRate } from './utils'
export { convertToVes, formatVes } from './utils'

import type { ExchangeRate } from './utils'

const FALLBACK_USD: ExchangeRate = {
  currency: 'usd',
  rateVes: 48.5,
  source: 'fallback-dev',
  fetchedAt: new Date(),
  isManualOverride: false,
}

const FALLBACK_EUR: ExchangeRate = {
  currency: 'eur',
  rateVes: 53.0,
  source: 'fallback-dev',
  fetchedAt: new Date(),
  isManualOverride: false,
}

// ---------------------------------------------------------------------------
// USD BCV fetch
// ---------------------------------------------------------------------------

async function fetchBcvUsdRate(): Promise<{ rateVes: number; fetchedAt: Date } | null> {
  try {
    const res = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv', {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`pydolarve HTTP ${res.status}`)
    const data = (await res.json()) as { price?: number; last_update?: string }
    if (!data.price || data.price <= 0) throw new Error('Invalid price from pydolarve')
    return { rateVes: data.price, fetchedAt: data.last_update ? new Date(data.last_update) : new Date() }
  } catch (primaryErr) {
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`dolarapi HTTP ${res.status}`)
      const data = (await res.json()) as { promedio?: number; fechaActualizacion?: string }
      if (!data.promedio || data.promedio <= 0) throw new Error('Invalid promedio from dolarapi')
      return { rateVes: data.promedio, fetchedAt: data.fechaActualizacion ? new Date(data.fechaActualizacion) : new Date() }
    } catch {
      console.error('[exchange-rates/usd] both BCV sources failed:', primaryErr)
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// EUR BCV fetch
// Primary: dolarapi.com list endpoint (returns all currencies as array)
// Fallback: pydolarve.org EUR endpoint
// ---------------------------------------------------------------------------

async function fetchBcvEurRate(): Promise<{ rateVes: number; fetchedAt: Date } | null> {
  // Helper: extract a positive number from multiple possible field names
  function extractPrice(obj: Record<string, unknown>): number {
    const candidates = ['promedio', 'precio', 'price', 'tasa', 'valor', 'rate']
    for (const key of candidates) {
      const v = Number(obj[key])
      if (v > 0) return v
    }
    return 0
  }
  function extractDate(obj: Record<string, unknown>): Date {
    const candidates = ['fechaActualizacion', 'last_update', 'lastUpdate', 'fecha', 'updatedAt']
    for (const key of candidates) {
      const s = obj[key]
      if (typeof s === 'string' && s) return new Date(s)
    }
    return new Date()
  }

  // Primary: dolarapi.com — full list, find EUR item by nombre
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares', {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`dolarapi-list HTTP ${res.status}`)
    const raw: unknown = await res.json()

    // Response may be array or object; normalize to array of entries
    const entries: Record<string, unknown>[] = Array.isArray(raw)
      ? (raw as Record<string, unknown>[])
      : Object.values(raw as object).filter((v) => typeof v === 'object' && v !== null) as Record<string, unknown>[]

    const eurItem = entries.find((item) => {
      const name = String(item.nombre ?? item.name ?? item.moneda ?? '').toLowerCase()
      return name.includes('euro') || name === 'eur'
    })

    const price = eurItem ? extractPrice(eurItem) : 0
    if (price <= 0) throw new Error(`EUR item not found or price=0. Keys: ${entries.map(e => e.nombre).join(', ')}`)

    return { rateVes: price, fetchedAt: extractDate(eurItem!) }
  } catch (primaryErr) {
    console.error('[exchange-rates/eur] dolarapi-list failed:', String(primaryErr))

    // Fallback: pydolarve.org EUR endpoint
    try {
      const res = await fetch('https://pydolarve.org/api/v1/euro?page=bcv', {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`pydolarve-eur HTTP ${res.status}`)
      const raw: unknown = await res.json()
      const data = raw as Record<string, unknown>
      const price = extractPrice(data)
      if (price <= 0) throw new Error(`pydolarve EUR price=0. Keys: ${Object.keys(data).join(', ')}`)
      return { rateVes: price, fetchedAt: extractDate(data) }
    } catch (fallbackErr) {
      console.error('[exchange-rates/eur] pydolarve fallback also failed:', String(fallbackErr))
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// getCurrentRate — USD
// ---------------------------------------------------------------------------

export async function getCurrentRate(): Promise<ExchangeRate> {
  if (!process.env.DATABASE_URL) return FALLBACK_USD
  try {
    const stored = await getLatestRate('usd')
    if (stored) {
      return { currency: 'usd', rateVes: stored.rateVes, source: stored.source, fetchedAt: stored.fetchedAt, isManualOverride: stored.isManualOverride }
    }
    return await refreshRate()
  } catch {
    return { ...FALLBACK_USD, source: 'fallback-db-error' }
  }
}

// ---------------------------------------------------------------------------
// getCurrentEurRate — EUR
// ---------------------------------------------------------------------------

export async function getCurrentEurRate(): Promise<ExchangeRate> {
  if (!process.env.DATABASE_URL) return FALLBACK_EUR
  try {
    const stored = await getLatestRate('eur')
    if (stored) {
      return { currency: 'eur', rateVes: stored.rateVes, source: stored.source, fetchedAt: stored.fetchedAt, isManualOverride: stored.isManualOverride }
    }
    return await refreshEurRate()
  } catch {
    return { ...FALLBACK_EUR, source: 'fallback-db-error' }
  }
}

// ---------------------------------------------------------------------------
// getDisplayRate — reads active_display_rate setting and returns the right rate
// Used by cart, PDP, checkout for displaying prices in Bs.
// ---------------------------------------------------------------------------

export async function getDisplayRate(): Promise<ExchangeRate> {
  if (!process.env.DATABASE_URL) return FALLBACK_USD
  try {
    const [row] = await db
      .select({ value: applicationSettings.value })
      .from(applicationSettings)
      .where(eq(applicationSettings.key, 'active_display_rate'))
      .limit(1)
    const currency = row?.value === 'eur' ? 'eur' : 'usd'
    return currency === 'eur' ? getCurrentEurRate() : getCurrentRate()
  } catch {
    return getCurrentRate()
  }
}

// ---------------------------------------------------------------------------
// refreshRate — USD — fetches from BCV and persists (called by cron)
// ---------------------------------------------------------------------------

export async function refreshRate(): Promise<ExchangeRate> {
  const fetched = await fetchBcvUsdRate()
  if (!fetched) {
    const stored = await getLatestRate('usd').catch(() => null)
    if (stored) {
      return { currency: 'usd', rateVes: stored.rateVes, source: `${stored.source}(cached-on-fetch-error)`, fetchedAt: stored.fetchedAt, isManualOverride: stored.isManualOverride }
    }
    return { ...FALLBACK_USD, source: 'fallback-fetch-error' }
  }
  await saveRate({ currency: 'usd', rateVes: fetched.rateVes, source: 'pydolarve/bcv', fetchedAt: fetched.fetchedAt })
  return { currency: 'usd', rateVes: fetched.rateVes, source: 'pydolarve/bcv', fetchedAt: fetched.fetchedAt, isManualOverride: false }
}

// ---------------------------------------------------------------------------
// refreshEurRate — EUR — fetches from BCV and persists (called by cron)
// ---------------------------------------------------------------------------

export async function refreshEurRate(): Promise<ExchangeRate> {
  const fetched = await fetchBcvEurRate()
  if (!fetched) {
    const stored = await getLatestRate('eur').catch(() => null)
    if (stored) {
      return { currency: 'eur', rateVes: stored.rateVes, source: `${stored.source}(cached-on-fetch-error)`, fetchedAt: stored.fetchedAt, isManualOverride: stored.isManualOverride }
    }
    return { ...FALLBACK_EUR, source: 'fallback-fetch-error' }
  }
  await saveRate({ currency: 'eur', rateVes: fetched.rateVes, source: 'pydolarve/bcv-eur', fetchedAt: fetched.fetchedAt })
  return { currency: 'eur', rateVes: fetched.rateVes, source: 'pydolarve/bcv-eur', fetchedAt: fetched.fetchedAt, isManualOverride: false }
}
