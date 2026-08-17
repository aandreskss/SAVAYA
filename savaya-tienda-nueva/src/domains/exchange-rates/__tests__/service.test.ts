import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('getCurrentRate() — dev fallback (no DATABASE_URL)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('DATABASE_URL', '')
  })

  it('returns the fallback rate when DATABASE_URL is not set', async () => {
    const { getCurrentRate } = await import('../service')
    const rate = await getCurrentRate()
    expect(rate.currency).toBe('usd')
    expect(typeof rate.rateVes).toBe('number')
    expect(rate.rateVes).toBeGreaterThan(0)
    expect(rate.source).toContain('fallback')
    expect(rate.isManualOverride).toBe(false)
    expect(rate.fetchedAt).toBeInstanceOf(Date)
  })

  it('returns rateVes 48.5 as the dev fallback value', async () => {
    const { getCurrentRate } = await import('../service')
    const rate = await getCurrentRate()
    expect(rate.rateVes).toBe(48.5)
  })
})

describe('convertToVes()', () => {
  it('multiplies amount by rateVes correctly', async () => {
    const { convertToVes } = await import('../service')
    const rate = {
      currency: 'usd' as const,
      rateVes: 48.5,
      source: 'test',
      fetchedAt: new Date(),
      isManualOverride: false,
    }
    expect(convertToVes(45, rate)).toBe(2182.5)
  })

  it('returns 0 for amount 0', async () => {
    const { convertToVes } = await import('../service')
    const rate = {
      currency: 'usd' as const,
      rateVes: 48.5,
      source: 'test',
      fetchedAt: new Date(),
      isManualOverride: false,
    }
    expect(convertToVes(0, rate)).toBe(0)
  })
})

describe('formatVes()', () => {
  it('contains the formatted thousand-separated number', async () => {
    const { formatVes } = await import('../service')
    const formatted = formatVes(2182.5)
    // es-VE uses . as thousands separator → "2.182"
    expect(formatted).toContain('2.182')
  })

  it('returns a non-empty string for any positive value', async () => {
    const { formatVes } = await import('../service')
    expect(typeof formatVes(100)).toBe('string')
    expect(formatVes(100).length).toBeGreaterThan(0)
  })
})
