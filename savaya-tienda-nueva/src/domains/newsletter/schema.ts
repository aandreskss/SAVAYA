import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core'

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  status: text('status').notNull().default('active'), // 'active' | 'unsubscribed'
  source: text('source').notNull().default('website'),
  resendContactId: text('resend_contact_id'),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
})
