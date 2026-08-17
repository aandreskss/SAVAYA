import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  pgEnum,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from '@/domains/auth/schema'
import { orders } from '@/domains/orders/schema'
import { paymentMethods, paymentCurrencyEnum } from '@/domains/payment-methods/schema'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const proofStatusEnum = pgEnum('proof_status', [
  'pending',
  'approved',
  'rejected',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const paymentProofs = pgTable(
  'payment_proofs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    paymentMethodId: uuid('payment_method_id')
      .notNull()
      .references(() => paymentMethods.id, { onDelete: 'restrict' }),
    amountPaid: numeric('amount_paid', { precision: 10, scale: 2 }).notNull(),
    currency: paymentCurrencyEnum('currency').notNull(),
    reference: text('reference').notNull(),
    paymentDate: date('payment_date').notNull(),
    holderName: text('holder_name').notNull(),
    cloudinaryPublicId: text('cloudinary_public_id'),
    cloudinaryUrl: text('cloudinary_url'),
    metadata: jsonb('metadata'),  // method-specific fields: bankName, bankPhone, etc.
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    status: proofStatusEnum('status').notNull().default('pending'),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('payment_proofs_order_id_idx').on(t.orderId),
    index('payment_proofs_status_idx').on(t.status),
    index('payment_proofs_created_at_idx').on(t.createdAt),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const paymentProofsRelations = relations(paymentProofs, ({ one }) => ({
  order: one(orders, { fields: [paymentProofs.orderId], references: [orders.id] }),
  paymentMethod: one(paymentMethods, {
    fields: [paymentProofs.paymentMethodId],
    references: [paymentMethods.id],
  }),
  reviewer: one(users, { fields: [paymentProofs.reviewedBy], references: [users.id] }),
}))
