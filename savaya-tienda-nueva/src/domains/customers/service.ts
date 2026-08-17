import { db } from '@/shared/lib/db'
import { auth } from '@/domains/auth/auth'
import { customers, addresses } from './schema'
import { getCustomerByEmail } from './repository'
import { eq, and } from 'drizzle-orm'
import type { CustomerProfile } from './types'

// ---------------------------------------------------------------------------
// Session context
// ---------------------------------------------------------------------------

export type SessionCustomer = {
  userId: string
  email: string
  name: string | null
  customer: CustomerProfile | null
}

/**
 * Resolves the authenticated user + their customer record (if any).
 * Throws 'UNAUTHORIZED' if no valid session — callers should catch and redirect.
 * Customer record may be null for users who registered but never ordered.
 */
export async function getSessionCustomer(): Promise<SessionCustomer> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    throw new Error('UNAUTHORIZED')
  }
  const customer = await getCustomerByEmail(session.user.email)
  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    customer,
  }
}

// ---------------------------------------------------------------------------
// Customer record management
// ---------------------------------------------------------------------------

/**
 * Returns existing customer or creates a new one for users who registered
 * but haven't placed an order yet. Called when the customer first saves an address.
 */
export async function ensureCustomerExists(
  email: string,
  firstName: string,
  lastName: string,
): Promise<string> {
  const existing = await getCustomerByEmail(email)
  if (existing) return existing.id

  const [created] = await db
    .insert(customers)
    .values({ email, firstName, lastName })
    .returning({ id: customers.id })
  return created.id
}

// ---------------------------------------------------------------------------
// Address ownership guard
// ---------------------------------------------------------------------------

/**
 * Asserts that the given address belongs to the given customer.
 * Throws 'ADDRESS_NOT_FOUND' if not found or ownership mismatch.
 * Always call before any address mutation.
 */
export async function assertAddressOwner(
  addressId: string,
  customerId: string,
): Promise<void> {
  const rows = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.customerId, customerId)))
    .limit(1)
  if (!rows[0]) throw new Error('ADDRESS_NOT_FOUND')
}

// ---------------------------------------------------------------------------
// Default address logic
// ---------------------------------------------------------------------------

/**
 * Clears isDefault on all addresses of a customer, then sets it on one.
 * Runs inside a transaction.
 */
export async function setDefaultAddress(
  addressId: string,
  customerId: string,
): Promise<void> {
  await assertAddressOwner(addressId, customerId)
  await db.transaction(async (tx) => {
    await tx
      .update(addresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(addresses.customerId, customerId))
    await tx
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(addresses.id, addressId), eq(addresses.customerId, customerId)))
  })
}
