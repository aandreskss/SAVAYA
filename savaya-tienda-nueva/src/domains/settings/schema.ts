import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from '@/domains/auth/schema'

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const applicationSettings = pgTable(
  'application_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').unique().notNull(),
    value: text('value').notNull(),
    description: text('description'),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const applicationSettingsRelations = relations(applicationSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [applicationSettings.updatedBy],
    references: [users.id],
  }),
}))
