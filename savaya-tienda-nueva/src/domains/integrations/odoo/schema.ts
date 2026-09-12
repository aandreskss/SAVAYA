import { pgTable, text, timestamp, uuid, integer, pgEnum } from 'drizzle-orm/pg-core'

export const odooSyncTypeEnum = pgEnum('odoo_sync_type', ['full_sync', 'webhook'])

export const odooSyncStatusEnum = pgEnum('odoo_sync_status', [
  'success',
  'partial',
  'error',
])

export const odooSyncLogs = pgTable('odoo_sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: odooSyncTypeEnum('type').notNull(),
  status: odooSyncStatusEnum('status').notNull(),
  itemsSynced: integer('items_synced').notNull().default(0),
  itemsSkipped: integer('items_skipped').notNull().default(0),
  itemsFailed: integer('items_failed').notNull().default(0),
  errorMessage: text('error_message'),
  durationMs: integer('duration_ms'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export type OdooSyncLog = typeof odooSyncLogs.$inferSelect
export type OdooSyncLogInsert = typeof odooSyncLogs.$inferInsert
