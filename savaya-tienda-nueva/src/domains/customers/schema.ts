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
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from '@/domains/auth/schema'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const customerTagEnum = pgEnum('customer_tag', [
  'new',
  'returning',
  'vip',
  'high_ticket',
  'inactive',
  'frequent',
  'wholesale',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    phone: text('phone'),
    whatsapp: text('whatsapp'),
    isActive: boolean('is_active').notNull().default(true),
    totalOrders: integer('total_orders').notNull().default(0),
    totalSpentUsd: numeric('total_spent_usd', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    lastOrderAt: timestamp('last_order_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('customers_is_active_idx').on(t.isActive),
    index('customers_last_order_at_idx').on(t.lastOrderAt),
    index('customers_total_spent_usd_idx').on(t.totalSpentUsd),
  ],
)

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    label: text('label').notNull().default('casa'),
    recipientName: text('recipient_name').notNull(),
    state: text('state').notNull(),
    city: text('city').notNull(),
    municipality: text('municipality').notNull(),
    parish: text('parish'),
    address: text('address').notNull(),
    reference: text('reference'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('addresses_customer_id_idx').on(t.customerId),
    index('addresses_is_default_idx').on(t.customerId, t.isDefault),
  ],
)

export const customerNotes = pgTable(
  'customer_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    // append-only — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('customer_notes_customer_id_idx').on(t.customerId)],
)

export const customerTags = pgTable(
  'customer_tags',
  {
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    tag: customerTagEnum('tag').notNull(),
  },
  (t) => [primaryKey({ columns: [t.customerId, t.tag] })],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(addresses),
  customerNotes: many(customerNotes),
  customerTags: many(customerTags),
}))

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
}))

export const customerNotesRelations = relations(customerNotes, ({ one }) => ({
  customer: one(customers, {
    fields: [customerNotes.customerId],
    references: [customers.id],
  }),
  author: one(users, { fields: [customerNotes.authorId], references: [users.id] }),
}))

export const customerTagsRelations = relations(customerTags, ({ one }) => ({
  customer: one(customers, {
    fields: [customerTags.customerId],
    references: [customers.id],
  }),
}))
