import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const paymentMethodTypeEnum = pgEnum('payment_method_type', [
  'zelle',
  'pago_movil',
  'pago_movil_qr',
  'bank_transfer',
  'usdt_trc20',
  'binance_pay',
  'cash',
])

export const paymentCurrencyEnum = pgEnum('payment_currency', ['usd', 'ves'])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    type: paymentMethodTypeEnum('type').notNull(),
    currency: paymentCurrencyEnum('currency').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    instructions: text('instructions'),
    accountDetails: jsonb('account_details'),
    iconUrl: text('icon_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('payment_methods_is_active_idx').on(t.isActive),
    index('payment_methods_sort_order_idx').on(t.sortOrder),
  ],
)
