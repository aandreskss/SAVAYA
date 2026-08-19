import { db } from '@/shared/lib/db'
import { paymentMethods } from '@/domains/payment-methods/schema'
import { eq, asc } from 'drizzle-orm'
import type { AdminPaymentMethod, AccountDetails } from './types'

function mapRow(r: typeof paymentMethods.$inferSelect): AdminPaymentMethod {
  return {
    id: r.id,
    name: r.name,
    type: r.type as AdminPaymentMethod['type'],
    currency: r.currency as AdminPaymentMethod['currency'],
    isActive: r.isActive,
    instructions: r.instructions ?? null,
    accountDetails: (r.accountDetails as AccountDetails) ?? null,
    iconUrl: r.iconUrl ?? null,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

export async function listPaymentMethods(): Promise<AdminPaymentMethod[]> {
  const rows = await db
    .select()
    .from(paymentMethods)
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.createdAt))
  return rows.map(mapRow)
}

export async function createPaymentMethod(params: {
  name: string
  type: AdminPaymentMethod['type']
  currency: AdminPaymentMethod['currency']
  instructions?: string | null
  accountDetails?: AccountDetails | null
  sortOrder?: number
}): Promise<AdminPaymentMethod> {
  const [row] = await db
    .insert(paymentMethods)
    .values({
      name: params.name,
      type: params.type,
      currency: params.currency,
      isActive: true,
      instructions: params.instructions ?? null,
      accountDetails: params.accountDetails ?? null,
      sortOrder: params.sortOrder ?? 0,
      updatedAt: new Date(),
    })
    .returning()
  return mapRow(row)
}

export async function updatePaymentMethod(
  id: string,
  params: {
    name?: string
    currency?: AdminPaymentMethod['currency']
    instructions?: string | null
    accountDetails?: AccountDetails | null
    sortOrder?: number
  },
): Promise<AdminPaymentMethod> {
  const [row] = await db
    .update(paymentMethods)
    .set({ ...params, updatedAt: new Date() })
    .where(eq(paymentMethods.id, id))
    .returning()
  return mapRow(row)
}

export async function togglePaymentMethod(id: string, isActive: boolean): Promise<void> {
  await db
    .update(paymentMethods)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(paymentMethods.id, id))
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id))
}
