import {
  pgTable,
  text,
  timestamp,
  uuid,
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

export const pageViews = pgTable(
  'page_views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    path: text('path').notNull(),
    referrer: text('referrer'),
    sessionId: text('session_id'),
    country: text('country'),
    city: text('city'),
    deviceType: text('device_type'),
    browser: text('browser'),
    os: text('os'),
    // append-only — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('page_views_path_idx').on(t.path),
    index('page_views_created_at_idx').on(t.createdAt),
    index('page_views_country_idx').on(t.country),
    index('page_views_session_id_idx').on(t.sessionId),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const orderAttributionsRelations = relations(orderAttributions, ({ one }) => ({
  order: one(orders, { fields: [orderAttributions.orderId], references: [orders.id] }),
}))
