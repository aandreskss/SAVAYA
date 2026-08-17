import { test, expect } from '@playwright/test'

test.describe('Search overlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('search button is visible in the navbar', async ({ page }) => {
    const searchBtn = page.getByRole('button', { name: /buscar/i })
    await expect(searchBtn).toBeVisible()
  })

  test('clicking the search button opens the search overlay', async ({ page }) => {
    await page.getByRole('button', { name: /buscar/i }).click()
    // The overlay should contain an input
    const input = page.getByRole('searchbox')
    await expect(input).toBeVisible()
  })

  test('typing in the search input updates the value', async ({ page }) => {
    await page.getByRole('button', { name: /buscar/i }).click()
    const input = page.getByRole('searchbox')
    await input.fill('sandalia')
    await expect(input).toHaveValue('sandalia')
  })

  test('pressing Escape closes the search overlay', async ({ page }) => {
    await page.getByRole('button', { name: /buscar/i }).click()
    await expect(page.getByRole('searchbox')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('searchbox')).not.toBeVisible()
  })

  test('search overlay is closed by default', async ({ page }) => {
    const input = page.getByRole('searchbox')
    await expect(input).not.toBeVisible()
  })
})
