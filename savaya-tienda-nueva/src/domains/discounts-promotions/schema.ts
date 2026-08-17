import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  numeric,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { customers } from '@/domains/customers/schema'
import { orders } from '@/domains/orders/schema'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',
  'fixed_usd',
])

export const discountAppliesToTypeEnum = pgEnum('discount_applies_to_type', [
  'all',
  'category',
  'product',
  'collection',
  'customer',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const discounts = pgTable(
  'discounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').unique().notNull(),
    type: discountTypeEnum('type').notNull(),
    value: numeric('value', { precision: 10, scale: 2 }).notNull(),
    minOrderUsd: numeric('min_order_usd', { precision: 10, scale: 2 }),
    maxUsesTotal: integer('max_uses_total'),
    maxUsesPerCustomer: integer('max_uses_per_customer').notNull().default(1),
    usedCount: integer('used_count').notNull().default(0),
    appliesToType: discountAppliesToTypeEnum('applies_to_type').notNull().default('all'),
    appliesToId: uuid('applies_to_id'),
    isFirstOrderOnly: boolean('is_first_order_only').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('discounts_is_active_idx').on(t.isActive),
    index('discounts_starts_at_ends_at_idx').on(t.startsAt, t.endsAt),
    index('discounts_applies_to_type_id_idx').on(t.appliesToType, t.appliesToId),
  ],
)

export const couponUsages = pgTable(
  'coupon_usages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    discountId: uuid('discount_id')
      .notNull()
      .references(() => discounts.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    // append-only — no updatedAt
    usedAt: timestamp('used_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('coupon_usages_discount_id_idx').on(t.discountId),
    index('coupon_usages_customer_id_idx').on(t.customerId),
    index('coupon_usages_order_id_idx').on(t.orderId),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const discountsRelations = relations(discounts, ({ many }) => ({
  usages: many(couponUsages),
}))

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  discount: one(discounts, {
    fields: [couponUsages.discountId],
    references: [discounts.id],
  }),
  customer: one(customers, {
    fields: [couponUsages.customerId],
    references: [customers.id],
  }),
  order: one(orders, { fields: [couponUsages.orderId], references: [orders.id] }),
}))
