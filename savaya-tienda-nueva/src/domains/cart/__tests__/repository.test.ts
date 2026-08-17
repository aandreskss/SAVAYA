import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('getCartSummary() — dev fallback (no DATABASE_URL)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('DATABASE_URL', '')
  })

  it('returns an empty cart when DATABASE_URL is not set', async () => {
    const { getCartSummary } = await import('../repository')
    const result = await getCartSummary('any-cart-id')
    expect(result.items).toHaveLength(0)
    expect(result.itemCount).toBe(0)
    expect(result.subtotalUsd).toBe(0)
  })

  it('hasUnavailableItems is false for an empty cart', async () => {
    const { getCartSummary } = await import('../repository')
    const result = await getCartSummary('any-cart-id')
    expect(result.hasUnavailableItems).toBe(false)
  })

  it('getOrCreateCart returns dev-cart when DATABASE_URL is not set', async () => {
    const { getOrCreateCart } = await import('../repository')
    const result = await getOrCreateCart(null, null)
    expect(result.cartId).toBe('dev-cart')
  })
})
