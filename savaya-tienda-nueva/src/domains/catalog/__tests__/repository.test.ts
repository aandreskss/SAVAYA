import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---------------------------------------------------------------------------
// getProducts — fallback without DATABASE_URL
// ---------------------------------------------------------------------------

describe('getProducts() — dev fallback (no DATABASE_URL)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('DATABASE_URL', '')
  })

  it('returns a non-empty array when DATABASE_URL is not set', async () => {
    const { getProducts } = await import('../repository')
    const result = await getProducts({})
    expect(result.items.length).toBeGreaterThan(0)
    expect(typeof result.total).toBe('number')
    expect(result.total).toBeGreaterThan(0)
  })

  it('respects limit and returns at most limit items', async () => {
    const { getProducts } = await import('../repository')
    const result = await getProducts({ page: 1, limit: 2 })
    expect(result.items.length).toBeLessThanOrEqual(2)
  })

  it('returns correct shape for each item', async () => {
    const { getProducts } = await import('../repository')
    const result = await getProducts({ limit: 3 })
    for (const item of result.items) {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('name')
      expect(item).toHaveProperty('slug')
      expect(typeof item.basePrice).toBe('number')
      expect(Array.isArray(item.availableColors)).toBe(true)
      expect(Array.isArray(item.images)).toBe(true)
      expect(typeof item.hasStock).toBe('boolean')
    }
  })

  it('filters onlyNew correctly', async () => {
    const { getProducts } = await import('../repository')
    const result = await getProducts({ onlyNew: true })
    for (const item of result.items) {
      expect(item.isNew).toBe(true)
    }
  })

  it('filters onlyOnSale correctly', async () => {
    const { getProducts } = await import('../repository')
    const result = await getProducts({ onlyOnSale: true })
    for (const item of result.items) {
      expect(item.compareAtPrice).not.toBeNull()
    }
  })

  it('returns page 2 correctly (pagination offset)', async () => {
    const { getProducts } = await import('../repository')
    const page1 = await getProducts({ page: 1, limit: 3 })
    const page2 = await getProducts({ page: 2, limit: 3 })
    // IDs on page 2 must not overlap with page 1
    const page1Ids = new Set(page1.items.map((i) => i.id))
    const overlap = page2.items.filter((i) => page1Ids.has(i.id))
    expect(overlap.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getCategoryBySlug — dev fallback
// ---------------------------------------------------------------------------

describe('getCategoryBySlug() — dev fallback (no DATABASE_URL)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('DATABASE_URL', '')
  })

  it('returns a category object for known dev slug', async () => {
    const { getCategoryBySlug } = await import('../repository')
    const cat = await getCategoryBySlug('mujer')
    expect(cat).not.toBeNull()
    expect(cat?.slug).toBe('mujer')
  })

  it('returns null for unknown slug', async () => {
    const { getCategoryBySlug } = await import('../repository')
    const cat = await getCategoryBySlug('non-existent-slug')
    expect(cat).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// getAvailableFilters — dev fallback
// ---------------------------------------------------------------------------

describe('getAvailableFilters() — dev fallback (no DATABASE_URL)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('DATABASE_URL', '')
  })

  it('returns colors, sizes and priceRange', async () => {
    const { getAvailableFilters } = await import('../repository')
    const filters = await getAvailableFilters()
    expect(Array.isArray(filters.colors)).toBe(true)
    expect(filters.colors.length).toBeGreaterThan(0)
    expect(Array.isArray(filters.sizes)).toBe(true)
    expect(filters.sizes.length).toBeGreaterThan(0)
    expect(filters.priceRange.min).toBeLessThanOrEqual(filters.priceRange.max)
  })
})
