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

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const shippingZoneTypeEnum = pgEnum('shipping_zone_type', [
  'local_delivery',
  'national_agency',
  'pickup',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const shippingZones = pgTable(
  'shipping_zones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    type: shippingZoneTypeEnum('type').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('shipping_zones_is_active_idx').on(t.isActive),
    index('shipping_zones_type_idx').on(t.type),
  ],
)

export const shippingCities = pgTable(
  'shipping_cities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    zoneId: uuid('zone_id')
      .notNull()
      .references(() => shippingZones.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    state: text('state').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    // append-only per design — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('shipping_cities_zone_id_idx').on(t.zoneId),
    index('shipping_cities_is_active_idx').on(t.isActive),
    index('shipping_cities_state_idx').on(t.state),
  ],
)

export const shippingMethods = pgTable(
  'shipping_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    zoneId: uuid('zone_id')
      .notNull()
      .references(() => shippingZones.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    provider: text('provider'),
    estimatedDays: integer('estimated_days'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('shipping_methods_zone_id_idx').on(t.zoneId),
    index('shipping_methods_is_active_idx').on(t.isActive),
  ],
)

export const shippingRates = pgTable(
  'shipping_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    methodId: uuid('method_id')
      .notNull()
      .references(() => shippingMethods.id, { onDelete: 'cascade' }),
    cityId: uuid('city_id').references(() => shippingCities.id, { onDelete: 'set null' }),
    minOrderUsd: numeric('min_order_usd', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    maxOrderUsd: numeric('max_order_usd', { precision: 10, scale: 2 }),
    rateUsd: numeric('rate_usd', { precision: 10, scale: 2 }).notNull(),
    freeShippingThresholdUsd: numeric('free_shipping_threshold_usd', {
      precision: 10,
      scale: 2,
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('shipping_rates_method_id_idx').on(t.methodId),
    index('shipping_rates_city_id_idx').on(t.cityId),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const shippingZonesRelations = relations(shippingZones, ({ many }) => ({
  cities: many(shippingCities),
  methods: many(shippingMethods),
}))

export const shippingCitiesRelations = relations(shippingCities, ({ one, many }) => ({
  zone: one(shippingZones, { fields: [shippingCities.zoneId], references: [shippingZones.id] }),
  rates: many(shippingRates),
}))

export const shippingMethodsRelations = relations(shippingMethods, ({ one, many }) => ({
  zone: one(shippingZones, {
    fields: [shippingMethods.zoneId],
    references: [shippingZones.id],
  }),
  rates: many(shippingRates),
}))

export const shippingRatesRelations = relations(shippingRates, ({ one }) => ({
  method: one(shippingMethods, {
    fields: [shippingRates.methodId],
    references: [shippingMethods.id],
  }),
  city: one(shippingCities, {
    fields: [shippingRates.cityId],
    references: [shippingCities.id],
  }),
}))
