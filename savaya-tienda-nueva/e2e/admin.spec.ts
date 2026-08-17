import { test, expect } from '@playwright/test'

test.describe('Admin panel auth protection', () => {
  test('/admin redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/iniciar-sesion|login/)
  })

  test('/admin/productos redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/productos')
    await expect(page).toHaveURL(/iniciar-sesion|login/)
  })

  test('/admin/pedidos redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/pedidos')
    await expect(page).toHaveURL(/iniciar-sesion|login/)
  })

  test('/admin/clientes redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin/clientes')
    await expect(page).toHaveURL(/iniciar-sesion|login/)
  })
})

test.describe('Login page', () => {
  test('login page renders with email and password fields', async ({ page }) => {
    await page.goto('/iniciar-sesion')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('textbox', { name: /email|correo/i })).toBeVisible()
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible()
  })

  test('login page has a form submit button', async ({ page }) => {
    await page.goto('/iniciar-sesion')
    await expect(page.getByRole('button', { name: /iniciar|entrar|ingresar/i })).toBeVisible()
  })

  test('login page has a link to create an account', async ({ page }) => {
    await page.goto('/iniciar-sesion')
    await expect(page.getByRole('link', { name: /crear cuenta|registr/i })).toBeVisible()
  })
})

test.describe('Register page', () => {
  test('register page renders', async ({ page }) => {
    const res = await page.goto('/crear-cuenta')
    expect(res?.status()).toBeLessThan(400)
    await expect(page.getByRole('main')).toBeVisible()
  })
})
