'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/shared/lib/db'
import { customers, addresses } from './schema'
import { accounts } from '@/domains/auth/schema'
import { getSessionCustomer, ensureCustomerExists, assertAddressOwner, setDefaultAddress } from './service'
import {
  UpdateProfileSchema,
  AddressSchema,
  ChangePasswordSchema,
  type UpdateProfileInput,
  type AddressInput,
  type ChangePasswordInput,
} from './validators'
import { checkRateLimit } from '@/shared/lib/rate-limit'
import { headers } from 'next/headers'
import type { ActionResult } from '@/shared/lib/types'
import bcrypt from 'bcryptjs'
import { eq, and } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getClientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? 'unknown'
}

function formatZodErrors(error: import('zod').ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!fieldErrors[field]) fieldErrors[field] = []
    fieldErrors[field].push(issue.message)
  }
  return fieldErrors
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function updateProfile(data: UpdateProfileInput): Promise<ActionResult<void>> {
  const session = await getSessionCustomer().catch(() => null)
  if (!session) return { success: false, error: 'No autenticado.' }

  const parsed = UpdateProfileSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos.', fieldErrors: formatZodErrors(parsed.error) }
  }

  const { firstName, lastName, phone, whatsapp } = parsed.data

  if (session.customer) {
    await db
      .update(customers)
      .set({
        firstName,
        lastName,
        phone: phone || null,
        whatsapp: whatsapp || null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, session.customer.id))
  } else {
    // User registered but never ordered — create customer record now
    await ensureCustomerExists(session.email, firstName, lastName)
    if (phone || whatsapp) {
      const created = await import('./repository').then((m) =>
        m.getCustomerByEmail(session.email),
      )
      if (created) {
        await db
          .update(customers)
          .set({ phone: phone || null, whatsapp: whatsapp || null, updatedAt: new Date() })
          .where(eq(customers.id, created.id))
      }
    }
  }

  revalidatePath('/mi-cuenta', 'layout')
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export async function createAddress(data: AddressInput): Promise<ActionResult<{ id: string }>> {
  const session = await getSessionCustomer().catch(() => null)
  if (!session) return { success: false, error: 'No autenticado.' }

  const parsed = AddressSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos.', fieldErrors: formatZodErrors(parsed.error) }
  }

  // Get or create the customer record
  const firstName = session.customer?.firstName ?? session.name?.split(' ')[0] ?? 'Cliente'
  const lastName = session.customer?.lastName ?? session.name?.split(' ').slice(1).join(' ') ?? ''
  const customerId = await ensureCustomerExists(session.email, firstName, lastName)

  const { isDefault, ...rest } = parsed.data

  // If this is the first address, make it default automatically
  const { getCustomerAddresses } = await import('./repository')
  const existing = await getCustomerAddresses(customerId)
  const shouldBeDefault = isDefault || existing.length === 0

  if (shouldBeDefault) {
    // Clear any existing default
    await db
      .update(addresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(addresses.customerId, customerId))
  }

  const [created] = await db
    .insert(addresses)
    .values({ ...rest, customerId, isDefault: shouldBeDefault })
    .returning({ id: addresses.id })

  revalidatePath('/mi-cuenta/direcciones')
  return { success: true, data: { id: created.id } }
}

export async function updateAddress(
  addressId: string,
  data: AddressInput,
): Promise<ActionResult<void>> {
  const session = await getSessionCustomer().catch(() => null)
  if (!session?.customer) return { success: false, error: 'No autenticado.' }

  const parsed = AddressSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos.', fieldErrors: formatZodErrors(parsed.error) }
  }

  try {
    await assertAddressOwner(addressId, session.customer.id)
  } catch {
    return { success: false, error: 'Dirección no encontrada.' }
  }

  const { isDefault, ...rest } = parsed.data

  if (isDefault) {
    await db
      .update(addresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(addresses.customerId, session.customer.id))
  }

  await db
    .update(addresses)
    .set({ ...rest, isDefault, updatedAt: new Date() })
    .where(and(eq(addresses.id, addressId), eq(addresses.customerId, session.customer.id)))

  revalidatePath('/mi-cuenta/direcciones')
  return { success: true, data: undefined }
}

export async function deleteAddress(addressId: string): Promise<ActionResult<void>> {
  const session = await getSessionCustomer().catch(() => null)
  if (!session?.customer) return { success: false, error: 'No autenticado.' }

  try {
    await assertAddressOwner(addressId, session.customer.id)
  } catch {
    return { success: false, error: 'Dirección no encontrada.' }
  }

  await db
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.customerId, session.customer.id)))

  revalidatePath('/mi-cuenta/direcciones')
  return { success: true, data: undefined }
}

export async function setAddressDefault(addressId: string): Promise<ActionResult<void>> {
  const session = await getSessionCustomer().catch(() => null)
  if (!session?.customer) return { success: false, error: 'No autenticado.' }

  try {
    await setDefaultAddress(addressId, session.customer.id)
  } catch {
    return { success: false, error: 'Dirección no encontrada.' }
  }

  revalidatePath('/mi-cuenta/direcciones')
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------

export async function changePassword(data: ChangePasswordInput): Promise<ActionResult<void>> {
  const session = await getSessionCustomer().catch(() => null)
  if (!session) return { success: false, error: 'No autenticado.' }

  const ip = await getClientIp()
  const rl = await checkRateLimit('login', ip)
  if (!rl.success) {
    return { success: false, error: 'Demasiados intentos. Intenta más tarde.' }
  }

  const parsed = ChangePasswordSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Datos inválidos.', fieldErrors: formatZodErrors(parsed.error) }
  }

  // Find the credentials account for this user
  const [account] = await db
    .select({ id: accounts.id, access_token: accounts.access_token })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, session.userId),
        eq(accounts.provider, 'credentials'),
      ),
    )
    .limit(1)

  if (!account?.access_token) {
    return { success: false, error: 'No se encontró una contraseña para esta cuenta.' }
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, account.access_token)
  if (!valid) {
    return { success: false, error: 'La contraseña actual es incorrecta.' }
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await db
    .update(accounts)
    .set({ access_token: newHash })
    .where(eq(accounts.id, account.id))

  return { success: true, data: undefined }
}
