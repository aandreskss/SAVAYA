'use server'

import { revalidatePath } from 'next/cache'
import { ActionResult } from '@/shared/lib/types'
import { db } from '@/shared/lib/db'
import { wishlistItems } from '@/domains/catalog/schema'
import { customers } from './schema'
import { getCustomerByEmail } from './repository'
import { auth } from '@/domains/auth/auth'
import { eq, and } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Resolve the authenticated customer's ID, creating the record lazily if needed
// ---------------------------------------------------------------------------

async function getCustomerId(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.email) return null
  if (!process.env.DATABASE_URL) return null

  const existing = await getCustomerByEmail(session.user.email)
  if (existing) return existing.id

  // User is authenticated but has never placed an order → no customer record yet.
  // Create a minimal one so the wishlist works immediately.
  const rawName = session.user.name ?? ''
  const spaceIdx = rawName.indexOf(' ')
  const firstName = spaceIdx > -1 ? rawName.slice(0, spaceIdx) : rawName || 'Cliente'
  const lastName = spaceIdx > -1 ? rawName.slice(spaceIdx + 1) : ''

  const [created] = await db
    .insert(customers)
    .values({ email: session.user.email, firstName, lastName })
    .returning({ id: customers.id })
  return created.id
}

// ---------------------------------------------------------------------------
// toggleWishlist
// Requires authenticated session. If unauthenticated, returns an error.
// ---------------------------------------------------------------------------

export async function toggleWishlist(
  productVariantId: string,
): Promise<ActionResult<{ isInWishlist: boolean }>> {
  const customerId = await getCustomerId()

  if (!customerId) {
    return {
      success: false,
      error: 'Debes iniciar sesión para guardar productos en tu wishlist.',
    }
  }

  if (!process.env.DATABASE_URL) {
    return { success: true, data: { isInWishlist: false } }
  }

  // Check if already in wishlist
  const existing = await db
    .select({ customerId: wishlistItems.customerId })
    .from(wishlistItems)
    .where(
      and(
        eq(wishlistItems.customerId, customerId),
        eq(wishlistItems.productVariantId, productVariantId),
      ),
    )
    .limit(1)

  if (existing[0]) {
    // Remove from wishlist
    await db
      .delete(wishlistItems)
      .where(
        and(
          eq(wishlistItems.customerId, customerId),
          eq(wishlistItems.productVariantId, productVariantId),
        ),
      )
    revalidatePath('/', 'layout')
    return { success: true, data: { isInWishlist: false } }
  }

  // Add to wishlist
  await db.insert(wishlistItems).values({ customerId, productVariantId })
  revalidatePath('/', 'layout')
  return { success: true, data: { isInWishlist: true } }
}

// ---------------------------------------------------------------------------
// getWishlistIds
// Returns variant IDs in the authenticated user's wishlist.
// Returns [] if not authenticated or no DB.
// ---------------------------------------------------------------------------

export async function getWishlistIds(): Promise<string[]> {
  const customerId = await getCustomerId()
  if (!customerId || !process.env.DATABASE_URL) return []

  const rows = await db
    .select({ productVariantId: wishlistItems.productVariantId })
    .from(wishlistItems)
    .where(eq(wishlistItems.customerId, customerId))

  return rows.map((r) => r.productVariantId)
}
