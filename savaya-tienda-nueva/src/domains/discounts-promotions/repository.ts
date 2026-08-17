import { db } from '@/shared/lib/db'
import { sql, eq, desc } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js'
import { discounts, couponUsages } from './schema'
import type { Discount, DiscountType, DiscountAppliesToType } from './types'
import type { DiscountFormPayload } from './validators'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTx = PgTransaction<PostgresJsQueryResultHKT, any, any>

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function listDiscounts(): Promise<Discount[]> {
  const rows = await db
    .select()
    .from(discounts)
    .orderBy(desc(discounts.createdAt))

  return rows.map(mapRow)
}

export async function findDiscountByCode(code: string): Promise<Discount | null> {
  const rows = await db
    .select()
    .from(discounts)
    .where(sql`UPPER(${discounts.code}) = UPPER(${code})`)
    .limit(1)

  return rows[0] ? mapRow(rows[0]) : null
}

export async function getDiscountById(id: string): Promise<Discount | null> {
  const rows = await db
    .select()
    .from(discounts)
    .where(eq(discounts.id, id))
    .limit(1)

  return rows[0] ? mapRow(rows[0]) : null
}

// How many times has this customer used this coupon?
export async function countCustomerUsages(
  discountId: string,
  customerId: string,
): Promise<number> {
  const [{ count }] = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM coupon_usages WHERE discount_id = ${discountId} AND customer_id = ${customerId}`,
  )
  return parseInt(count, 10)
}

// Does this customer have any prior orders (for isFirstOrderOnly check)?
export async function customerHasOrders(customerId: string): Promise<boolean> {
  const [{ count }] = await db.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM orders WHERE customer_id = ${customerId} AND status NOT IN ('cancelled')`,
  )
  return parseInt(count, 10) > 0
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

export async function createDiscount(payload: DiscountFormPayload): Promise<Discount> {
  const [row] = await db
    .insert(discounts)
    .values({
      code: payload.code.toUpperCase(),
      type: payload.type as DiscountType,
      value: String(payload.value),
      minOrderUsd: payload.minOrderUsd != null ? String(payload.minOrderUsd) : null,
      maxUsesTotal: payload.maxUsesTotal ?? null,
      maxUsesPerCustomer: payload.maxUsesPerCustomer,
      appliesToType: payload.appliesToType as DiscountAppliesToType,
      appliesToId: payload.appliesToId ?? null,
      isFirstOrderOnly: payload.isFirstOrderOnly,
      isActive: payload.isActive,
      startsAt: parseDate(payload.startsAt),
      endsAt: parseDate(payload.endsAt),
    })
    .returning()

  return mapRow(row)
}

export async function updateDiscount(
  id: string,
  payload: DiscountFormPayload,
): Promise<void> {
  await db
    .update(discounts)
    .set({
      code: payload.code.toUpperCase(),
      type: payload.type as DiscountType,
      value: String(payload.value),
      minOrderUsd: payload.minOrderUsd != null ? String(payload.minOrderUsd) : null,
      maxUsesTotal: payload.maxUsesTotal ?? null,
      maxUsesPerCustomer: payload.maxUsesPerCustomer,
      appliesToType: payload.appliesToType as DiscountAppliesToType,
      appliesToId: payload.appliesToId ?? null,
      isFirstOrderOnly: payload.isFirstOrderOnly,
      isActive: payload.isActive,
      startsAt: parseDate(payload.startsAt),
      endsAt: parseDate(payload.endsAt),
      updatedAt: new Date(),
    })
    .where(eq(discounts.id, id))
}

export async function deleteDiscount(id: string): Promise<void> {
  await db.delete(discounts).where(eq(discounts.id, id))
}

// ---------------------------------------------------------------------------
// Coupon usage recording (called inside createOrder transaction)
// ---------------------------------------------------------------------------

export async function recordCouponUsage(
  tx: AnyTx,
  {
    discountId,
    customerId,
    orderId,
  }: { discountId: string; customerId: string; orderId: string },
): Promise<void> {
  await tx.insert(couponUsages).values({ discountId, customerId, orderId })
  await tx
    .update(discounts)
    .set({ usedCount: sql`${discounts.usedCount} + 1`, updatedAt: new Date() })
    .where(eq(discounts.id, discountId))
}

// ---------------------------------------------------------------------------
// Internal mapper
// ---------------------------------------------------------------------------

type RawRow = typeof discounts.$inferSelect

function mapRow(row: RawRow): Discount {
  return {
    id: row.id,
    code: row.code,
    type: row.type as DiscountType,
    value: Number(row.value),
    minOrderUsd: row.minOrderUsd != null ? Number(row.minOrderUsd) : null,
    maxUsesTotal: row.maxUsesTotal,
    maxUsesPerCustomer: row.maxUsesPerCustomer,
    usedCount: row.usedCount,
    appliesToType: row.appliesToType as DiscountAppliesToType,
    appliesToId: row.appliesToId,
    isFirstOrderOnly: row.isFirstOrderOnly,
    isActive: row.isActive,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
