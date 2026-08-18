import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
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
// Postgres connection
// max: 1 is required in serverless (Vercel) to avoid connection pool exhaustion.
// Each function invocation gets its own connection that is closed on exit.
// ---------------------------------------------------------------------------

const client = postgres(process.env.DATABASE_URL!, {
  max: 5,          // allows parallel queries per Lambda invocation (PgBouncer multiplexes)
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,  // required for Supabase PgBouncer (transaction mode)
})

export const db = drizzle(client, {
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
