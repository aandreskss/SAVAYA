import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { customers } from '@/domains/customers/schema'
import { productVariants } from '@/domains/catalog/schema'

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'cascade',
    }),
    sessionId: text('session_id'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('carts_customer_id_idx').on(t.customerId),
    index('carts_session_id_idx').on(t.sessionId),
    index('carts_expires_at_idx').on(t.expiresAt),
  ],
)

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    priceSnapshot: numeric('price_snapshot', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('cart_items_cart_id_idx').on(t.cartId),
    index('cart_items_variant_id_idx').on(t.variantId),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, { fields: [carts.customerId], references: [customers.id] }),
  items: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}))
