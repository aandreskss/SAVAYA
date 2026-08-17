import 'server-only'
import { getLatestRate, saveRate } from './repository'
export type { ExchangeRate } from './utils'
export { convertToVes, formatVes } from './utils'

import type { ExchangeRate } from './utils'

const FALLBACK_RATE: ExchangeRate = {
  currency: 'usd',
  rateVes: 48.5,
  source: 'fallback-dev',
  fetchedAt: new Date(),
  isManualOverride: false,
}

// ---------------------------------------------------------------------------
// BCV fetch — primary: dolarapi.com, fallback: last stored rate
// ADR 003: source chosen for reliability + no API key requirement
// ---------------------------------------------------------------------------

type DolarApiResponse = {
  monitors: {
    bcv: {
      price: number
      last_update: string
    }
  }
}

async function fetchBcvRate(): Promise<{ rateVes: number; fetchedAt: Date } | null> {
  try {
    const res = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv', {
      next: { revalidate: 0 }, // always fresh when called explicitly
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) throw new Error(`pydolarve HTTP ${res.status}`)

    const data = (await res.json()) as { price?: number; last_update?: string }
    if (!data.price || data.price <= 0) throw new Error('Invalid price from pydolarve')

    return {
      rateVes: data.price,
      fetchedAt: data.last_update ? new Date(data.last_update) : new Date(),
    }
  } catch (primaryErr) {
    // Fallback to dolarapi.com
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`dolarapi HTTP ${res.status}`)

      const data = (await res.json()) as { promedio?: number; fechaActualizacion?: string }
      if (!data.promedio || data.promedio <= 0) throw new Error('Invalid promedio from dolarapi')

      return {
        rateVes: data.promedio,
        fetchedAt: data.fechaActualizacion ? new Date(data.fechaActualizacion) : new Date(),
      }
    } catch {
      console.error('[exchange-rates] both BCV sources failed:', primaryErr)
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// getCurrentRate — used everywhere in the app (PDP, checkout, etc.)
// Priority: DB (latest, including manual override) → fallback-dev
// ---------------------------------------------------------------------------

export async function getCurrentRate(): Promise<ExchangeRate> {
  if (!process.env.DATABASE_URL) {
    return FALLBACK_RATE
  }

  try {
    const stored = await getLatestRate('usd')
    if (stored) {
      return {
        currency: 'usd',
        rateVes: stored.rateVes,
        source: stored.source,
        fetchedAt: stored.fetchedAt,
        isManualOverride: stored.isManualOverride,
      }
    }
    // No stored rate — try to fetch and store one immediately
    return await refreshRate()
  } catch {
    return { ...FALLBACK_RATE, source: 'fallback-db-error' }
  }
}

// ---------------------------------------------------------------------------
// refreshRate — fetches from BCV and persists. Called by the cron endpoint.
// ---------------------------------------------------------------------------

export async function refreshRate(): Promise<ExchangeRate> {
  const fetched = await fetchBcvRate()

  if (!fetched) {
    // Return last stored rate if fetch failed
    const stored = await getLatestRate('usd').catch(() => null)
    if (stored) {
      return {
        currency: 'usd',
        rateVes: stored.rateVes,
        source: `${stored.source}(cached-on-fetch-error)`,
        fetchedAt: stored.fetchedAt,
        isManualOverride: stored.isManualOverride,
      }
    }
    return { ...FALLBACK_RATE, source: 'fallback-fetch-error' }
  }

  await saveRate({
    currency: 'usd',
    rateVes: fetched.rateVes,
    source: 'pydolarve/bcv',
    fetchedAt: fetched.fetchedAt,
  })

  return {
    currency: 'usd',
    rateVes: fetched.rateVes,
    source: 'pydolarve/bcv',
    fetchedAt: fetched.fetchedAt,
    isManualOverride: false,
  }
}

