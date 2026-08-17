'use server'

import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/shared/lib/types'
import { getCartId, recalculateCart } from './service'
import {
  addItem,
  removeItem,
  updateItemQuantity,
  getCartSummary,
} from './repository'
import type { CartSummary } from './repository'

// ---------------------------------------------------------------------------
// addToCart
// 1. Gets or creates cartId from cookie
// 2. Verifies variant exists + has stock (server-side — never trusts client)
// 3. Adds item to cart
// 4. Returns updated CartSummary
// 5. Revalidates current path
// ---------------------------------------------------------------------------

export async function addToCart(
  variantId: string,
  quantity: number,
): Promise<ActionResult<CartSummary>> {
  if (!variantId || variantId.trim() === '') {
    return {
      success: false,
      error: 'Debes seleccionar una variante antes de agregar al carrito.',
    }
  }

  if (quantity < 1) {
    return { success: false, error: 'La cantidad mínima es 1.' }
  }

  const cartId = await getCartId()

  const result = await addItem(cartId, variantId, quantity)

  if (!result.success) {
    return { success: false, error: result.error ?? 'Error al agregar al carrito.' }
  }

  const summary = await recalculateCart(cartId)

  revalidatePath('/', 'layout')

  return { success: true, data: summary }
}

// ---------------------------------------------------------------------------
// removeFromCart
// ---------------------------------------------------------------------------

export async function removeFromCart(
  cartItemId: string,
): Promise<ActionResult<CartSummary>> {
  if (!cartItemId) {
    return { success: false, error: 'ID de ítem inválido.' }
  }

  const cartId = await getCartId()

  await removeItem(cartId, cartItemId)

  const summary = await recalculateCart(cartId)

  revalidatePath('/', 'layout')

  return { success: true, data: summary }
}

// ---------------------------------------------------------------------------
// updateCartItemQuantity
// quantity = 0 removes the item
// ---------------------------------------------------------------------------

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
): Promise<ActionResult<CartSummary>> {
  if (!cartItemId) {
    return { success: false, error: 'ID de ítem inválido.' }
  }

  const cartId = await getCartId()

  const result = await updateItemQuantity(cartId, cartItemId, quantity)

  if (!result.success) {
    return { success: false, error: result.error ?? 'Error al actualizar la cantidad.' }
  }

  const summary = await recalculateCart(cartId)

  revalidatePath('/', 'layout')

  return { success: true, data: summary }
}

// ---------------------------------------------------------------------------
// getCart
// Reads the current cart (for the drawer and cart page).
// ---------------------------------------------------------------------------

export async function getCart(): Promise<CartSummary> {
  const cartId = await getCartId()
  return getCartSummary(cartId)
}
