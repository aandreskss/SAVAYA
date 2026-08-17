import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { orders } from '@/domains/orders/schema'

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const orderAttributions = pgTable(
  'order_attributions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .unique()
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    utmTerm: text('utm_term'),
    fbc: text('fbc'),
    fbp: text('fbp'),
    fbclid: text('fbclid'),
    gclid: text('gclid'),
    // append-only — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('order_attributions_utm_source_idx').on(t.utmSource),
    index('order_attributions_utm_campaign_idx').on(t.utmCampaign),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const orderAttributionsRelations = relations(orderAttributions, ({ one }) => ({
  order: one(orders, { fields: [orderAttributions.orderId], references: [orders.id] }),
}))
