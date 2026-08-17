import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  pgEnum,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { users } from '@/domains/auth/schema'
import { productVariants } from '@/domains/catalog/schema'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'purchase',
  'sale',
  'adjustment',
  'return',
  'cancellation',
  'correction',
  'reservation',
  'reservation_release',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const inventory = pgTable(
  'inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    variantId: uuid('variant_id')
      .unique()
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('inventory_quantity_non_negative', sql`${t.quantity} >= 0`),
    check('inventory_reserved_non_negative', sql`${t.reserved} >= 0`),
    check(
      'inventory_reserved_lte_quantity',
      sql`${t.reserved} <= ${t.quantity}`,
    ),
    index('inventory_quantity_idx').on(t.quantity),
  ],
)

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    type: inventoryMovementTypeEnum('type').notNull(),
    quantity: integer('quantity').notNull(),
    reason: text('reason'),
    orderId: uuid('order_id'), // FK to orders — set after orders schema created, cross-domain
    performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'set null' }),
    // append-only — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('inventory_movements_variant_id_idx').on(t.variantId),
    index('inventory_movements_type_idx').on(t.type),
    index('inventory_movements_order_id_idx').on(t.orderId),
    index('inventory_movements_created_at_idx').on(t.createdAt),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const inventoryRelations = relations(inventory, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventory.variantId],
    references: [productVariants.id],
  }),
}))

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryMovements.variantId],
    references: [productVariants.id],
  }),
  performedByUser: one(users, {
    fields: [inventoryMovements.performedBy],
    references: [users.id],
  }),
}))
