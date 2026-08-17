import { cookies } from 'next/headers'
import { getOrCreateCart, getCartSummary } from './repository'
import type { CartSummary } from './repository'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CART_COOKIE = 'savaya-cart-id'
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// ---------------------------------------------------------------------------
// getCartId
// Reads the cart cookie. If missing, creates a new cart and sets the cookie.
// For authenticated users: uses their customerId (Fase 3.7 wires real auth).
// ---------------------------------------------------------------------------

export async function getCartId(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(CART_COOKIE)?.value

  if (existing) return existing

  // No cookie — create a new guest cart
  const { cartId } = await getOrCreateCart(null, null)

  cookieStore.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: CART_COOKIE_MAX_AGE,
    path: '/',
  })

  return cartId
}

// ---------------------------------------------------------------------------
// recalculateCart
// Always recomputes prices + stock from DB — never trusts client data.
// ---------------------------------------------------------------------------

export async function recalculateCart(cartId: string): Promise<CartSummary> {
  return getCartSummary(cartId)
}
