import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the page title in the document head', async ({ page }) => {
    await expect(page).toHaveTitle(/SAVAYA/)
  })

  test('skip-to-content link is present in the DOM', async ({ page }) => {
    const skip = page.getByRole('link', { name: /saltar al contenido/i })
    await expect(skip).toBeAttached()
  })

  test('skip-to-content link becomes visible on focus', async ({ page }) => {
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: /saltar al contenido/i })
    await expect(skip).toBeVisible()
  })

  test('renders the hero headline from dev fallback', async ({ page }) => {
    await expect(page.getByText('Marca tu moda')).toBeVisible()
  })

  test('renders the "Compra por categoría" section', async ({ page }) => {
    await expect(page.getByText('Compra por categoría')).toBeVisible()
  })

  test('displays category links in shop-by-category block', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sandalias/i })).toBeVisible()
  })

  test('navbar is present with SAVAYA wordmark', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('banner').getByText('SAVAYA')).toBeVisible()
  })

  test('footer is present', async ({ page }) => {
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })

  test('announcement bar is visible', async ({ page }) => {
    await expect(page.getByText(/Envíos a todo Venezuela/)).toBeVisible()
  })

  test('Organization JSON-LD is present in the page head', async ({ page }) => {
    const ldJson = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      const contents = Array.from(scripts).map((s) => {
        try { return JSON.parse(s.textContent ?? '') } catch { return null }
      })
      return contents.find((d) => d?.['@type'] === 'ClothingStore')
    })
    expect(ldJson).toBeTruthy()
    expect(ldJson['name']).toBe('SAVAYA')
  })
})
