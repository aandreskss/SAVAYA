import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Without CLOUD_NAME — module-level constant is '' by default
// ---------------------------------------------------------------------------

describe('cloudinaryUrl() — no CLOUD_NAME configured', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('returns publicId unchanged when CLOUD_NAME is empty', async () => {
    const { cloudinaryUrl } = await import('../cloudinary')
    expect(cloudinaryUrl('savaya/products/abc123')).toBe('savaya/products/abc123')
  })

  it('returns publicId unchanged when publicId is empty string', async () => {
    const { cloudinaryUrl } = await import('../cloudinary')
    expect(cloudinaryUrl('')).toBe('')
  })

  it('cloudinaryBlurPlaceholder returns publicId unchanged without CLOUD_NAME', async () => {
    const { cloudinaryBlurPlaceholder } = await import('../cloudinary')
    expect(cloudinaryBlurPlaceholder('savaya/test')).toBe('savaya/test')
  })

  it('presets return publicId unchanged without CLOUD_NAME', async () => {
    const { cloudinaryPresets } = await import('../cloudinary')
    expect(cloudinaryPresets.productCard('savaya/products/shoe')).toBe('savaya/products/shoe')
    expect(cloudinaryPresets.thumbnail('savaya/products/shoe')).toBe('savaya/products/shoe')
  })
})

// ---------------------------------------------------------------------------
// With CLOUD_NAME — must reset modules so the constant re-evaluates
// ---------------------------------------------------------------------------

describe('cloudinaryUrl() — with CLOUD_NAME set', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'savaya-cloud')
  })

  it('builds a valid Cloudinary URL with auto format and quality 80', async () => {
    const { cloudinaryUrl } = await import('../cloudinary')
    const url = cloudinaryUrl('savaya/products/abc123')
    expect(url).toContain('https://res.cloudinary.com/savaya-cloud/image/upload/')
    expect(url).toContain('f_auto')
    expect(url).toContain('q_80')
    expect(url).toContain('savaya/products/abc123')
  })

  it('includes width transform when specified', async () => {
    const { cloudinaryUrl } = await import('../cloudinary')
    const url = cloudinaryUrl('savaya/products/abc123', { width: 400 })
    expect(url).toContain('w_400')
  })

  it('includes crop and gravity when specified', async () => {
    const { cloudinaryUrl } = await import('../cloudinary')
    const url = cloudinaryUrl('savaya/products/abc123', { crop: 'fill', gravity: 'auto' })
    expect(url).toContain('c_fill')
    expect(url).toContain('g_auto')
  })

  it('cloudinaryBlurPlaceholder includes blur transform', async () => {
    const { cloudinaryBlurPlaceholder } = await import('../cloudinary')
    const url = cloudinaryBlurPlaceholder('savaya/products/abc123')
    expect(url).toContain('e_blur:500')
    expect(url).toContain('w_20')
    expect(url).toContain('q_30')
  })

  it('cloudinaryPresets.productCard uses w_600 fill auto', async () => {
    const { cloudinaryPresets } = await import('../cloudinary')
    const url = cloudinaryPresets.productCard('savaya/products/shoe')
    expect(url).toContain('w_600')
    expect(url).toContain('c_fill')
    expect(url).toContain('g_auto')
  })

  it('cloudinaryPresets.thumbnail uses 120x120 fill', async () => {
    const { cloudinaryPresets } = await import('../cloudinary')
    const url = cloudinaryPresets.thumbnail('savaya/products/shoe')
    expect(url).toContain('w_120')
    expect(url).toContain('h_120')
    expect(url).toContain('c_fill')
  })

  it('cloudinaryPresets.heroBanner uses w_1920 and q_70', async () => {
    const { cloudinaryPresets } = await import('../cloudinary')
    const url = cloudinaryPresets.heroBanner('savaya/banners/hero')
    expect(url).toContain('w_1920')
    expect(url).toContain('q_70')
  })

  it('cloudinaryPresets.productGallery accepts custom width', async () => {
    const { cloudinaryPresets } = await import('../cloudinary')
    const url = cloudinaryPresets.productGallery('savaya/products/shoe', 1200)
    expect(url).toContain('w_1200')
    expect(url).toContain('c_fill')
  })
})
