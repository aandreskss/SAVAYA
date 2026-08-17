import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  numeric,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from '@/domains/auth/schema'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const exchangeRateCurrencyEnum = pgEnum('exchange_rate_currency', ['usd', 'eur'])

// ---------------------------------------------------------------------------
// Tables — append-only (never UPDATE, always INSERT for new rate)
// ---------------------------------------------------------------------------

export const exchangeRates = pgTable(
  'exchange_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    currency: exchangeRateCurrencyEnum('currency').notNull(),
    rateVes: numeric('rate_ves', { precision: 10, scale: 4 }).notNull(),
    source: text('source').notNull(),
    isManualOverride: boolean('is_manual_override').notNull().default(false),
    overrideReason: text('override_reason'),
    overrideBy: uuid('override_by').references(() => users.id, { onDelete: 'set null' }),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    // append-only — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('exchange_rates_currency_created_at_idx').on(t.currency, t.createdAt),
    index('exchange_rates_is_manual_override_idx').on(t.isManualOverride),
    index('exchange_rates_fetched_at_idx').on(t.fetchedAt),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
  overrideByUser: one(users, {
    fields: [exchangeRates.overrideBy],
    references: [users.id],
  }),
}))
