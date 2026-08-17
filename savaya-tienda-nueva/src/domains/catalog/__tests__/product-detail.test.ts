import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('getProductBySlug() — dev fallback (no DATABASE_URL)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('DATABASE_URL', '')
  })

  it('returns null for a slug that does not exist in dev fallback', async () => {
    const { getProductBySlug } = await import('../repository')
    const result = await getProductBySlug('inexistente')
    expect(result).toBeNull()
  })

  it('returns the fallback product for sandalia-punta-fina', async () => {
    const { getProductBySlug } = await import('../repository')
    const result = await getProductBySlug('sandalia-punta-fina')
    expect(result).not.toBeNull()
    expect(result?.slug).toBe('sandalia-punta-fina')
    expect(result?.name).toBeDefined()
    expect(typeof result?.basePrice).toBe('number')
  })

  it('fallback product has variants', async () => {
    const { getProductBySlug } = await import('../repository')
    const result = await getProductBySlug('sandalia-punta-fina')
    expect(Array.isArray(result?.variants)).toBe(true)
    expect(result!.variants.length).toBeGreaterThan(0)
  })

  it('fallback has at least 1 variant with isAvailable true', async () => {
    const { getProductBySlug } = await import('../repository')
    const result = await getProductBySlug('sandalia-punta-fina')
    const availableVariants = result!.variants.filter((v) => v.isAvailable)
    expect(availableVariants.length).toBeGreaterThan(0)
  })

  it('fallback product has the correct shape on all variant fields', async () => {
    const { getProductBySlug } = await import('../repository')
    const result = await getProductBySlug('sandalia-punta-fina')
    for (const variant of result!.variants) {
      expect(typeof variant.id).toBe('string')
      expect(typeof variant.sku).toBe('string')
      expect(typeof variant.price).toBe('number')
      expect(typeof variant.isActive).toBe('boolean')
      expect(typeof variant.stock).toBe('number')
      expect(typeof variant.isAvailable).toBe('boolean')
      expect(variant.color).toHaveProperty('id')
      expect(variant.color).toHaveProperty('name')
      expect(variant.color).toHaveProperty('hex')
      expect(variant.size).toHaveProperty('id')
      expect(variant.size).toHaveProperty('name')
      // isAvailable must be consistent with stock
      if (variant.stock > 0 && variant.isActive) {
        expect(variant.isAvailable).toBe(true)
      }
      if (variant.stock === 0) {
        expect(variant.isAvailable).toBe(false)
      }
    }
  })

  it('fallback product has images with correct shape', async () => {
    const { getProductBySlug } = await import('../repository')
    const result = await getProductBySlug('sandalia-punta-fina')
    expect(result!.images.length).toBeGreaterThan(0)
    for (const img of result!.images) {
      expect(typeof img.id).toBe('string')
      expect(typeof img.url).toBe('string')
      expect(img.url.startsWith('http')).toBe(true)
      expect(['image', 'video']).toContain(img.type)
    }
  })

  it('fallback product has a category', async () => {
    const { getProductBySlug } = await import('../repository')
    const result = await getProductBySlug('sandalia-punta-fina')
    expect(result?.category).not.toBeNull()
    expect(typeof result?.category?.slug).toBe('string')
  })
})
