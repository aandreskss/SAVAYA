import { test, expect } from '@playwright/test'

// Run these tests at a 390px (iPhone 14) viewport
test.use({ viewport: { width: 390, height: 844 } })

test.describe('Mobile responsive — 390px viewport', () => {
  test('home page renders without horizontal overflow', async ({ page }) => {
    await page.goto('/')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth)
  })

  test('hero section is visible on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Marca tu moda')).toBeVisible()
  })

  test('navbar is visible on mobile', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
  })

  test('mobile search button is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /buscar/i })).toBeVisible()
  })

  test('cart page renders on mobile', async ({ page }) => {
    await page.goto('/carrito')
    await expect(page.locator('main')).toBeVisible()
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth)
  })

  test('login page renders correctly on mobile', async ({ page }) => {
    await page.goto('/iniciar-sesion')
    await expect(page.getByRole('main')).toBeVisible()
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth)
  })

  test('informational page /nosotros renders on mobile', async ({ page }) => {
    await page.goto('/nosotros')
    await expect(page.locator('main')).toBeVisible()
  })

  test('footer is visible on mobile', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer).toBeVisible()
  })
})
