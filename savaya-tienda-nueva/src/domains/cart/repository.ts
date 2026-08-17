import { db } from '@/shared/lib/db'
import { carts, cartItems } from './schema'
import { products, productVariants, productMedia, colors, sizes } from '@/domains/catalog/schema'
import { inventory } from '@/domains/inventory/schema'
import { eq, and, inArray } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartItemDetail = {
  cartItemId: string
  variantId: string
  productId: string
  productName: string
  productSlug: string
  sku: string
  color: { name: string; hex: string }
  size: { name: string }
  quantity: number
  unitPriceUsd: number        // precio REAL de DB — nunca del cliente
  totalPriceUsd: number       // unitPrice * quantity
  compareAtPrice: number | null
  imageUrl: string | null
  imageAlt: string | null
  availableStock: number      // inventory.quantity - inventory.reserved
  isAvailable: boolean        // stock > 0 && variant.isActive && product.isActive
}

export type CartSummary = {
  cartId: string
  items: CartItemDetail[]
  subtotalUsd: number
  itemCount: number
  hasUnavailableItems: boolean   // algún item perdió stock después de agregarse
}

// ---------------------------------------------------------------------------
// Empty fallback (sin DB)
// ---------------------------------------------------------------------------

function emptyCart(cartId = ''): CartSummary {
  return {
    cartId,
    items: [],
    subtotalUsd: 0,
    itemCount: 0,
    hasUnavailableItems: false,
  }
}

// ---------------------------------------------------------------------------
// getOrCreateCart
// ---------------------------------------------------------------------------

export async function getOrCreateCart(
  customerId?: string | null,
  sessionId?: string | null,
): Promise<{ cartId: string }> {
  if (!process.env.DATABASE_URL) {
    return { cartId: 'dev-cart' }
  }

  // If customerId: look for existing customer cart
  if (customerId) {
    const existing = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.customerId, customerId))
      .limit(1)

    if (existing[0]) return { cartId: existing[0].id }

    // Create new cart for this customer
    const [created] = await db
      .insert(carts)
      .values({ customerId })
      .returning({ id: carts.id })
    return { cartId: created.id }
  }

  // Guest cart: look by sessionId
  if (sessionId) {
    const existing = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1)

    if (existing[0]) return { cartId: existing[0].id }
  }

  // Create new guest cart
  const [created] = await db
    .insert(carts)
    .values({ sessionId: sessionId ?? null })
    .returning({ id: carts.id })
  return { cartId: created.id }
}

// ---------------------------------------------------------------------------
// getCartSummary
// ---------------------------------------------------------------------------

export async function getCartSummary(cartId: string): Promise<CartSummary> {
  if (!process.env.DATABASE_URL || !cartId || cartId === 'dev-cart') {
    return emptyCart(cartId)
  }

  try {
    // Fetch all cart items with variant + product + stock info
    const rows = await db
      .select({
        cartItemId: cartItems.id,
        quantity: cartItems.quantity,
        variantId: productVariants.id,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        productIsActive: products.isActive,
        sku: productVariants.sku,
        variantPrice: productVariants.price,
        variantCompareAtPrice: productVariants.compareAtPrice,
        variantIsActive: productVariants.isActive,
        colorName: colors.name,
        colorHex: colors.hex,
        sizeName: sizes.name,
        invQuantity: inventory.quantity,
        invReserved: inventory.reserved,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(productVariants.id, cartItems.variantId))
      .innerJoin(products, eq(products.id, productVariants.productId))
      .innerJoin(colors, eq(colors.id, productVariants.colorId))
      .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(eq(cartItems.cartId, cartId))

    if (rows.length === 0) return emptyCart(cartId)

    // Fetch primary images for these products
    const productIds = [...new Set(rows.map((r) => r.productId))]
    const mediaRows = await db
      .select({
        productId: productMedia.productId,
        url: productMedia.url,
        altText: productMedia.altText,
        isPrimary: productMedia.isPrimary,
        sortOrder: productMedia.sortOrder,
      })
      .from(productMedia)
      .where(
        and(
          inArray(productMedia.productId, productIds),
          eq(productMedia.type, 'image'),
        ),
      )
      .orderBy(productMedia.isPrimary, productMedia.sortOrder)

    // Primary image per product
    const imageByProduct = new Map<string, { url: string; alt: string | null }>()
    for (const m of mediaRows) {
      if (!imageByProduct.has(m.productId) || m.isPrimary) {
        imageByProduct.set(m.productId, { url: m.url, alt: m.altText })
      }
    }

    // Build items
    const items: CartItemDetail[] = rows.map((row) => {
      const unitPriceUsd = Number(row.variantPrice)
      const quantity = row.quantity
      const invQty = row.invQuantity ?? 0
      const invReserved = row.invReserved ?? 0
      const availableStock = Math.max(0, invQty - invReserved)
      const isAvailable =
        availableStock > 0 && row.variantIsActive && row.productIsActive
      const image = imageByProduct.get(row.productId) ?? null

      return {
        cartItemId: row.cartItemId,
        variantId: row.variantId,
        productId: row.productId,
        productName: row.productName,
        productSlug: row.productSlug,
        sku: row.sku,
        color: { name: row.colorName, hex: row.colorHex ?? '#888888' },
        size: { name: row.sizeName },
        quantity,
        unitPriceUsd,
        totalPriceUsd: unitPriceUsd * quantity,
        compareAtPrice:
          row.variantCompareAtPrice !== null
            ? Number(row.variantCompareAtPrice)
            : null,
        imageUrl: image?.url ?? null,
        imageAlt: image?.alt ?? null,
        availableStock,
        isAvailable,
      }
    })

    // Subtotal only counts available items
    const subtotalUsd = items
      .filter((i) => i.isAvailable)
      .reduce((sum, i) => sum + i.totalPriceUsd, 0)

    return {
      cartId,
      items,
      subtotalUsd,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      hasUnavailableItems: items.some((i) => !i.isAvailable),
    }
  } catch {
    // DB error — return empty to avoid breaking the UI
    return emptyCart(cartId)
  }
}

// ---------------------------------------------------------------------------
// addItem
// ---------------------------------------------------------------------------

export async function addItem(
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.DATABASE_URL) {
    return { success: true }
  }

  // Verify variant exists and is active
  const variantRows = await db
    .select({
      id: productVariants.id,
      price: productVariants.price,
      isActive: productVariants.isActive,
      productId: productVariants.productId,
    })
    .from(productVariants)
    .where(and(eq(productVariants.id, variantId), eq(productVariants.isActive, true)))
    .limit(1)

  if (!variantRows[0]) {
    return { success: false, error: 'La variante seleccionada no está disponible.' }
  }

  // Check stock
  const stockRows = await db
    .select({ quantity: inventory.quantity, reserved: inventory.reserved })
    .from(inventory)
    .where(eq(inventory.variantId, variantId))
    .limit(1)

  const inv = stockRows[0]
  const availableStock = inv ? Math.max(0, inv.quantity - inv.reserved) : 0

  if (availableStock <= 0) {
    return { success: false, error: 'Este producto no tiene stock disponible.' }
  }

  // Check if item already exists in cart
  const existing = await db
    .select({ id: cartItems.id, quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)))
    .limit(1)

  if (existing[0]) {
    // Increment, but cap at available stock
    const newQty = Math.min(existing[0].quantity + quantity, availableStock)
    await db
      .update(cartItems)
      .set({ quantity: newQty, updatedAt: new Date() })
      .where(eq(cartItems.id, existing[0].id))
  } else {
    const cappedQty = Math.min(quantity, availableStock)
    await db.insert(cartItems).values({
      cartId,
      variantId,
      quantity: cappedQty,
      priceSnapshot: variantRows[0].price,
    })
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateItemQuantity
// ---------------------------------------------------------------------------

export async function updateItemQuantity(
  cartId: string,
  cartItemId: string,
  quantity: number,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.DATABASE_URL) {
    return { success: true }
  }

  if (quantity <= 0) {
    await removeItem(cartId, cartItemId)
    return { success: true }
  }

  // Get the item to know the variantId
  const itemRows = await db
    .select({ variantId: cartItems.variantId })
    .from(cartItems)
    .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)))
    .limit(1)

  if (!itemRows[0]) {
    return { success: false, error: 'El ítem no existe en este carrito.' }
  }

  // Check stock
  const stockRows = await db
    .select({ quantity: inventory.quantity, reserved: inventory.reserved })
    .from(inventory)
    .where(eq(inventory.variantId, itemRows[0].variantId))
    .limit(1)

  const inv = stockRows[0]
  const availableStock = inv ? Math.max(0, inv.quantity - inv.reserved) : 0

  if (availableStock <= 0) {
    return { success: false, error: 'No hay stock disponible para esta variante.' }
  }

  const safeQty = Math.min(quantity, availableStock)
  await db
    .update(cartItems)
    .set({ quantity: safeQty, updatedAt: new Date() })
    .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)))

  return { success: true }
}

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------

export async function removeItem(cartId: string, cartItemId: string): Promise<void> {
  if (!process.env.DATABASE_URL) return

  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)))
}

// ---------------------------------------------------------------------------
// clearCart
// ---------------------------------------------------------------------------

export async function clearCart(cartId: string): Promise<void> {
  if (!process.env.DATABASE_URL) return

  await db.delete(cartItems).where(eq(cartItems.cartId, cartId))
}

// ---------------------------------------------------------------------------
// mergeGuestCart
// Moves items from guest cart into the customer cart.
// On variant conflict: take the higher quantity (capped to stock).
// ---------------------------------------------------------------------------

export async function mergeGuestCart(
  guestCartId: string,
  customerId: string,
): Promise<void> {
  if (!process.env.DATABASE_URL) return

  // Find customer cart
  const customerCartRows = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.customerId, customerId))
    .limit(1)

  if (!customerCartRows[0]) return // no customer cart to merge into

  const customerCartId = customerCartRows[0].id

  // Get guest items
  const guestRows = await db
    .select({
      id: cartItems.id,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      priceSnapshot: cartItems.priceSnapshot,
    })
    .from(cartItems)
    .where(eq(cartItems.cartId, guestCartId))

  if (guestRows.length === 0) return

  // Get stock for all guest variants
  const variantIds = guestRows.map((r) => r.variantId)
  const stockRows = await db
    .select({ variantId: inventory.variantId, quantity: inventory.quantity, reserved: inventory.reserved })
    .from(inventory)
    .where(inArray(inventory.variantId, variantIds))

  const stockMap = new Map(
    stockRows.map((s) => [s.variantId, Math.max(0, s.quantity - s.reserved)]),
  )

  // Get existing customer cart items
  const existingRows = await db
    .select({ id: cartItems.id, variantId: cartItems.variantId, quantity: cartItems.quantity })
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, customerCartId),
        inArray(
          cartItems.variantId,
          variantIds,
        ),
      ),
    )

  const existingMap = new Map(existingRows.map((r) => [r.variantId, r]))

  for (const guestItem of guestRows) {
    const stock = stockMap.get(guestItem.variantId) ?? 0
    if (stock <= 0) continue

    const existing = existingMap.get(guestItem.variantId)
    if (existing) {
      // Take the higher quantity, capped to stock
      const newQty = Math.min(Math.max(existing.quantity, guestItem.quantity), stock)
      await db
        .update(cartItems)
        .set({ quantity: newQty, updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id))
    } else {
      const cappedQty = Math.min(guestItem.quantity, stock)
      await db.insert(cartItems).values({
        cartId: customerCartId,
        variantId: guestItem.variantId,
        quantity: cappedQty,
        priceSnapshot: guestItem.priceSnapshot,
      })
    }
  }

  // Delete guest cart items
  await clearCart(guestCartId)
}
