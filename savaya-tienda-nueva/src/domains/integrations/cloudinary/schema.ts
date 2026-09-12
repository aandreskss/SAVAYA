import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const cloudinaryNotifications = pgTable('cloudinary_notifications', {
  id:               uuid('id').primaryKey().defaultRandom(),
  notificationType: text('notification_type').notNull(),
  publicIds:        text('public_ids').array().notNull(),
  resourceType:     text('resource_type').notNull(),
  payload:          jsonb('payload').notNull(),
  receivedAt:       timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
})
