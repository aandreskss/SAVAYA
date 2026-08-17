import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  pgEnum,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from '@/domains/auth/schema'
import { customers } from '@/domains/customers/schema'
import { productVariants } from '@/domains/catalog/schema'
import { paymentMethods } from '@/domains/payment-methods/schema'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'payment_under_review',
  'payment_rejected',
  'paid',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
])

export const reservationPaymentTypeEnum = pgEnum('reservation_payment_type', [
  'full',
  'partial_20',
  'partial_35',
  'partial_50',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').unique().notNull(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    status: orderStatusEnum('status').notNull().default('pending_payment'),
    subtotalUsd: numeric('subtotal_usd', { precision: 10, scale: 2 }).notNull(),
    discountUsd: numeric('discount_usd', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    shippingCostUsd: numeric('shipping_cost_usd', { precision: 10, scale: 2 }).notNull(),
    totalUsd: numeric('total_usd', { precision: 10, scale: 2 }).notNull(),
    exchangeRateSnapshot: numeric('exchange_rate_snapshot', {
      precision: 10,
      scale: 4,
    }).notNull(),
    totalBs: numeric('total_bs', { precision: 12, scale: 2 }).notNull(),
    reservationPaymentType: reservationPaymentTypeEnum('reservation_payment_type'),
    paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id, {
      onDelete: 'set null',
    }),
    shippingSnapshot: jsonb('shipping_snapshot'),
    reservedUntil: timestamp('reserved_until', { withTimezone: true }),
    notes: text('notes'),
    idempotencyKey: text('idempotency_key').unique().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('orders_customer_id_idx').on(t.customerId),
    index('orders_status_idx').on(t.status),
    index('orders_created_at_idx').on(t.createdAt),
    index('orders_status_created_at_idx').on(t.status, t.createdAt),
    index('orders_reserved_until_idx').on(t.reservedUntil),
    index('orders_payment_method_id_idx').on(t.paymentMethodId),
  ],
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, {
      onDelete: 'set null',
    }),
    quantity: integer('quantity').notNull(),
    unitPriceUsd: numeric('unit_price_usd', { precision: 10, scale: 2 }).notNull(),
    totalUsd: numeric('total_usd', { precision: 10, scale: 2 }).notNull(),
    productSnapshot: jsonb('product_snapshot').notNull(),
    // append-only — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('order_items_order_id_idx').on(t.orderId),
    index('order_items_variant_id_idx').on(t.variantId),
  ],
)

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    fromStatus: orderStatusEnum('from_status'),
    toStatus: orderStatusEnum('to_status').notNull(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    reason: text('reason'),
    // append-only — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('order_status_history_order_id_idx').on(t.orderId),
    index('order_status_history_created_at_idx').on(t.createdAt),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  paymentMethod: one(paymentMethods, {
    fields: [orders.paymentMethodId],
    references: [paymentMethods.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}))

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
  actor: one(users, { fields: [orderStatusHistory.actorId], references: [users.id] }),
}))
