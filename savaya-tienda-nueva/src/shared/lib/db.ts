import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as authSchema from '@/domains/auth/schema'
import * as usersSchema from '@/domains/users/schema'
import * as rolesPermissionsSchema from '@/domains/roles-permissions/schema'
import * as customersSchema from '@/domains/customers/schema'
import * as catalogSchema from '@/domains/catalog/schema'
import * as inventorySchema from '@/domains/inventory/schema'
import * as cartSchema from '@/domains/cart/schema'
import * as ordersSchema from '@/domains/orders/schema'
import * as paymentMethodsSchema from '@/domains/payment-methods/schema'
import * as paymentProofsSchema from '@/domains/payment-proofs/schema'
import * as shippingSchema from '@/domains/shipping/schema'
import * as discountsPromotionsSchema from '@/domains/discounts-promotions/schema'
import * as cmsSchema from '@/domains/cms/schema'
import * as exchangeRatesSchema from '@/domains/exchange-rates/schema'
import * as analyticsSchema from '@/domains/analytics/schema'
import * as settingsSchema from '@/domains/settings/schema'
import * as auditLogSchema from '@/domains/audit-log/schema'
import * as notificationsSchema from '@/domains/notifications/schema'
import * as wholesaleSchema from '@/domains/wholesale/schema'

// ---------------------------------------------------------------------------
// Neon HTTP driver — stateless HTTP requests per query, no persistent TCP
// connections, no connection pool limits. Ideal for Vercel serverless.
// Transactions are batched in a single HTTP request via Neon's batch API.
// ---------------------------------------------------------------------------

const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, {
  schema: {
    ...authSchema,
    ...usersSchema,
    ...rolesPermissionsSchema,
    ...customersSchema,
    ...catalogSchema,
    ...inventorySchema,
    ...cartSchema,
    ...ordersSchema,
    ...paymentMethodsSchema,
    ...paymentProofsSchema,
    ...shippingSchema,
    ...discountsPromotionsSchema,
    ...cmsSchema,
    ...exchangeRatesSchema,
    ...analyticsSchema,
    ...settingsSchema,
    ...auditLogSchema,
    ...notificationsSchema,
    ...wholesaleSchema,
  },
})

export type Database = typeof db

// ---------------------------------------------------------------------------
// rawQuery — executes raw SQL and returns rows as an array.
// Neon HTTP driver returns { rows: T[] } instead of T[] directly (unlike postgres.js).
// ---------------------------------------------------------------------------
import type { SQL } from 'drizzle-orm'

export async function rawQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  query: SQL,
): Promise<T[]> {
  const result = await db.execute(query)
  return result.rows as T[]
}
