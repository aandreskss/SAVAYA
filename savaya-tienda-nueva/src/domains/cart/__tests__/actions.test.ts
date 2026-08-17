import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock next/headers and next/cache at the TOP LEVEL (hoisted by Vitest)
// ---------------------------------------------------------------------------

vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: () => ({ value: 'test-cart-id' }),
      set: () => undefined,
    }),
}))

vi.mock('next/cache', () => ({
  revalidatePath: () => undefined,
}))

describe('addToCart() — dev fallback (no DATABASE_URL)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('DATABASE_URL', '')
  })

  it('returns success: true with a CartSummary when DATABASE_URL is not set', async () => {
    const { addToCart } = await import('../actions')
    const result = await addToCart('valid-variant-id', 1)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveProperty('cartId')
      expect(result.data).toHaveProperty('items')
      expect(result.data).toHaveProperty('subtotalUsd')
      expect(result.data).toHaveProperty('itemCount')
    }
  })

  it('returns success: false when variantId is empty', async () => {
    const { addToCart } = await import('../actions')
    const result = await addToCart('', 1)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
  })

  it('returns success: false when variantId is only whitespace', async () => {
    const { addToCart } = await import('../actions')
    const result = await addToCart('   ', 1)
    expect(result.success).toBe(false)
  })

  it('returns success: false when quantity is less than 1', async () => {
    const { addToCart } = await import('../actions')
    const result = await addToCart('some-variant', 0)
    expect(result.success).toBe(false)
  })
})

describe('getCart() — dev fallback (no DATABASE_URL)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('DATABASE_URL', '')
  })

  it('returns a CartSummary with itemCount 0 when no DB', async () => {
    const { getCart } = await import('../actions')
    const result = await getCart()
    expect(result.itemCount).toBe(0)
    expect(Array.isArray(result.items)).toBe(true)
  })
})
