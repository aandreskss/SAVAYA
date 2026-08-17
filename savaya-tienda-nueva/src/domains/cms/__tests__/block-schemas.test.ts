import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  HeroSchema,
  AnnouncementBarSchema,
  ProductCarouselSchema,
  ShopByCategorySchema,
  BenefitsBlockSchema,
} from '../block-schemas'

// ---------------------------------------------------------------------------
// HeroSchema
// ---------------------------------------------------------------------------

const validHero = {
  headline: 'Marca tu moda',
  subheadline: 'Calzado femenino venezolano',
  ctaPrimaryText: 'Ver colección',
  ctaPrimaryHref: '/coleccion',
  imageDesktopUrl: 'https://example.com/hero-desktop.jpg',
  imageMobileUrl: 'https://example.com/hero-mobile.jpg',
  imageAlt: 'Calzado SAVAYA',
  overlayOpacity: 0.3,
}

describe('HeroSchema', () => {
  it('validates a correct hero object', () => {
    const result = HeroSchema.safeParse(validHero)
    expect(result.success).toBe(true)
  })

  it('applies default overlayOpacity when not provided', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { overlayOpacity: _op, ...withoutOpacity } = validHero
    const result = HeroSchema.safeParse(withoutOpacity)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.overlayOpacity).toBe(0.3)
    }
  })

  it('fails when headline is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { headline: _h, ...withoutHeadline } = validHero
    const result = HeroSchema.safeParse(withoutHeadline)
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.headline).toBeDefined()
    }
  })

  it('fails when imageDesktopUrl is not a URL', () => {
    const result = HeroSchema.safeParse({ ...validHero, imageDesktopUrl: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('fails when overlayOpacity exceeds 0.8', () => {
    const result = HeroSchema.safeParse({ ...validHero, overlayOpacity: 0.9 })
    expect(result.success).toBe(false)
  })

  it('fails when overlayOpacity is negative', () => {
    const result = HeroSchema.safeParse({ ...validHero, overlayOpacity: -0.1 })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// AnnouncementBarSchema
// ---------------------------------------------------------------------------

describe('AnnouncementBarSchema', () => {
  it('validates a correct announcement bar', () => {
    const result = AnnouncementBarSchema.safeParse({
      text: 'Envíos a todo Venezuela',
      bgColor: 'brand-black',
    })
    expect(result.success).toBe(true)
  })

  it('applies default bgColor brand-black', () => {
    const result = AnnouncementBarSchema.safeParse({ text: 'Hola' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.bgColor).toBe('brand-black')
    }
  })

  it('fails when text exceeds 200 characters', () => {
    const longText = 'a'.repeat(201)
    const result = AnnouncementBarSchema.safeParse({ text: longText })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      expect(fields.text).toBeDefined()
    }
  })

  it('accepts text of exactly 200 characters', () => {
    const result = AnnouncementBarSchema.safeParse({ text: 'a'.repeat(200) })
    expect(result.success).toBe(true)
  })

  it('fails when bgColor is invalid enum value', () => {
    const result = AnnouncementBarSchema.safeParse({ text: 'Hola', bgColor: 'red' })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ProductCarouselSchema — cross-field limitation documented
// ---------------------------------------------------------------------------

describe('ProductCarouselSchema', () => {
  it('validates a correct carousel with source: new', () => {
    const result = ProductCarouselSchema.safeParse({
      title: 'Nuevos ingresos',
      source: 'new',
      limit: 8,
    })
    expect(result.success).toBe(true)
  })

  it('validates a carousel with source: collection and collectionSlug', () => {
    const result = ProductCarouselSchema.safeParse({
      title: 'Colección verano',
      source: 'collection',
      collectionSlug: 'verano-2026',
      limit: 6,
    })
    expect(result.success).toBe(true)
  })

  it('does NOT fail when source is collection but collectionSlug is absent (known limitation)', () => {
    // Cross-field validation (source === 'collection' requires collectionSlug) is
    // NOT enforced at schema level. The schema accepts this combination.
    // The repository layer handles the missing slug gracefully (returns empty results).
    // A future enhancement can use .superRefine() to add this constraint.
    const result = ProductCarouselSchema.safeParse({
      title: 'Colección verano',
      source: 'collection',
      limit: 6,
    })
    expect(result.success).toBe(true)
  })

  it('fails when limit is below 4', () => {
    const result = ProductCarouselSchema.safeParse({
      title: 'Nuevos ingresos',
      source: 'new',
      limit: 2,
    })
    expect(result.success).toBe(false)
  })

  it('fails when limit exceeds 12', () => {
    const result = ProductCarouselSchema.safeParse({
      title: 'Nuevos ingresos',
      source: 'new',
      limit: 15,
    })
    expect(result.success).toBe(false)
  })

  it('fails when source is an unknown value', () => {
    const result = ProductCarouselSchema.safeParse({
      title: 'X',
      source: 'trending',
      limit: 8,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ShopByCategorySchema
// ---------------------------------------------------------------------------

describe('ShopByCategorySchema', () => {
  it('validates a correct shop by category block', () => {
    const result = ShopByCategorySchema.safeParse({
      title: 'Compra por categoría',
      categories: [
        { name: 'Sandalias', slug: 'sandalias', imageUrl: 'https://example.com/cat.jpg' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('fails with empty categories array', () => {
    const result = ShopByCategorySchema.safeParse({ categories: [] })
    expect(result.success).toBe(false)
  })

  it('fails when a category imageUrl is not a valid URL', () => {
    const result = ShopByCategorySchema.safeParse({
      categories: [{ name: 'Sandalias', slug: 'sandalias', imageUrl: 'bad-url' }],
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// BenefitsBlockSchema
// ---------------------------------------------------------------------------

describe('BenefitsBlockSchema', () => {
  it('validates 4 valid benefits', () => {
    const result = BenefitsBlockSchema.safeParse({
      benefits: [
        { icon: 'truck', title: 'Envíos', description: 'A todo Venezuela' },
        { icon: 'shield', title: 'Seguridad', description: 'Compra protegida' },
        { icon: 'refresh', title: 'Cambios', description: 'En 7 días' },
        { icon: 'whatsapp', title: 'Soporte', description: 'Por WhatsApp' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('fails with fewer than 2 benefits', () => {
    const result = BenefitsBlockSchema.safeParse({
      benefits: [{ icon: 'truck', title: 'Envíos', description: 'Desc' }],
    })
    expect(result.success).toBe(false)
  })

  it('fails with an invalid icon name', () => {
    const result = BenefitsBlockSchema.safeParse({
      benefits: [
        { icon: 'plane', title: 'Envíos', description: 'Desc' },
        { icon: 'shield', title: 'Seguridad', description: 'Desc' },
      ],
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getHomeBlocks() with mocked repository
// ---------------------------------------------------------------------------

describe('getHomeBlocks() — fallback when DB is unavailable', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns dev fallback blocks when getHomePageSections returns fallback data', async () => {
    // Mock the repository module to return the fallback directly
    vi.doMock('@/domains/cms/repository', () => ({
      getHomePageSections: vi.fn().mockResolvedValue([
        {
          id: 'dev-announcement',
          type: 'announcement_bar',
          content: {
            text: 'Envíos a todo Venezuela',
            bgColor: 'brand-black',
          },
          sortOrder: 0,
        },
        {
          id: 'dev-hero',
          type: 'hero',
          content: {
            headline: 'Marca tu moda',
            ctaPrimaryText: 'Ver colección',
            ctaPrimaryHref: '/coleccion',
            imageDesktopUrl: 'https://example.com/d.jpg',
            imageMobileUrl: 'https://example.com/m.jpg',
            imageAlt: 'Alt',
            overlayOpacity: 0.35,
          },
          sortOrder: 1,
        },
      ]),
    }))

    const { getHomeBlocks } = await import('../service')
    const blocks = await getHomeBlocks()

    expect(blocks).toHaveLength(2)
    expect(blocks[0].type).toBe('announcement_bar')
    expect(blocks[1].type).toBe('hero')
  })

  it('skips blocks with invalid content and does not throw', async () => {
    vi.doMock('@/domains/cms/repository', () => ({
      getHomePageSections: vi.fn().mockResolvedValue([
        {
          id: 'bad-hero',
          type: 'hero',
          // missing required headline
          content: {
            ctaPrimaryText: 'Ver',
            ctaPrimaryHref: '/x',
            imageDesktopUrl: 'https://example.com/d.jpg',
            imageMobileUrl: 'https://example.com/m.jpg',
            imageAlt: 'Alt',
            overlayOpacity: 0.3,
          },
          sortOrder: 0,
        },
        {
          id: 'valid-bar',
          type: 'announcement_bar',
          content: { text: 'Texto válido', bgColor: 'brand-black' },
          sortOrder: 1,
        },
      ]),
    }))

    const { getHomeBlocks } = await import('../service')
    const blocks = await getHomeBlocks()

    // Only the valid announcement_bar survives
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('announcement_bar')
  })
})
