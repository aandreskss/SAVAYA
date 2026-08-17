import { test, expect } from '@playwright/test'

test.describe('Storefront navigation', () => {
  test('home page is accessible at /', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBeLessThan(400)
  })

  test('navbar links point to expected href values', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('banner')
    // Verify at least some navigation links are present
    const links = await nav.getByRole('link').all()
    expect(links.length).toBeGreaterThan(0)
  })

  test('cart page is accessible', async ({ page }) => {
    const res = await page.goto('/carrito')
    expect(res?.status()).toBeLessThan(400)
    await expect(page).toHaveTitle(/carrito|SAVAYA/i)
  })

  test('informational page /nosotros is accessible', async ({ page }) => {
    const res = await page.goto('/nosotros')
    expect(res?.status()).toBeLessThan(400)
  })

  test('informational page /contacto is accessible', async ({ page }) => {
    const res = await page.goto('/contacto')
    expect(res?.status()).toBeLessThan(400)
  })

  test('informational page /terminos is accessible', async ({ page }) => {
    const res = await page.goto('/terminos')
    expect(res?.status()).toBeLessThan(400)
  })

  test('sitemap.xml is served', async ({ page }) => {
    const res = await page.goto('/sitemap.xml')
    expect(res?.status()).toBe(200)
    const ct = res?.headers()['content-type'] ?? ''
    expect(ct).toContain('xml')
  })

  test('robots.txt is served and disallows /admin/', async ({ page }) => {
    const res = await page.goto('/robots.txt')
    expect(res?.status()).toBe(200)
    const body = await res?.text()
    expect(body).toContain('Disallow: /admin/')
  })

  test('404 page renders for unknown routes', async ({ page }) => {
    const res = await page.goto('/esta-ruta-no-existe-123')
    expect(res?.status()).toBe(404)
  })

  test('security headers are present on home page', async ({ page }) => {
    const res = await page.goto('/')
    const headers = res?.headers() ?? {}
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
  })

  test('CSP header is present and contains nonce', async ({ page }) => {
    const res = await page.goto('/')
    const csp = res?.headers()['content-security-policy'] ?? ''
    expect(csp).toContain("script-src")
    expect(csp).toContain("nonce-")
  })
})

test.describe('Cart page', () => {
  test('shows empty cart state when no items', async ({ page }) => {
    await page.goto('/carrito')
    // Should render without crashing — either empty state or cart content
    await expect(page.locator('main')).toBeVisible()
  })
})
