import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { orders } from '@/domains/orders/schema'
import { customers } from '@/domains/customers/schema'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const notificationTypeEnum = pgEnum('notification_type', [
  'email',
  'whatsapp_link',
  'sms',
])

export const notificationStatusEnum = pgEnum('notification_status', [
  'sent',
  'failed',
  'skipped',
])

// ---------------------------------------------------------------------------
// Tables — append-only log
// ---------------------------------------------------------------------------

export const notificationLog = pgTable(
  'notification_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: notificationTypeEnum('type').notNull(),
    recipient: text('recipient').notNull(),
    subject: text('subject'),
    templateId: text('template_id').notNull(),
    status: notificationStatusEnum('status').notNull(),
    error: text('error'),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    // append-only — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('notification_log_order_id_idx').on(t.orderId),
    index('notification_log_customer_id_idx').on(t.customerId),
    index('notification_log_status_idx').on(t.status),
    index('notification_log_created_at_idx').on(t.createdAt),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const notificationLogRelations = relations(notificationLog, ({ one }) => ({
  order: one(orders, { fields: [notificationLog.orderId], references: [orders.id] }),
  customer: one(customers, {
    fields: [notificationLog.customerId],
    references: [customers.id],
  }),
}))
