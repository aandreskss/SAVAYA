import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const wholesaleLeadStatusEnum = pgEnum('wholesale_lead_status', [
  'new',
  'contacted',
  'qualified',
  'disqualified',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const wholesaleLeads = pgTable(
  'wholesale_leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessName: text('business_name').notNull(),
    contactName: text('contact_name').notNull(),
    city: text('city').notNull(),
    whatsapp: text('whatsapp').notNull(),
    email: text('email'),
    estimatedMonthlyVolume: text('estimated_monthly_volume'),
    message: text('message'),
    status: wholesaleLeadStatusEnum('status').notNull().default('new'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('wholesale_leads_status_idx').on(t.status),
    index('wholesale_leads_created_at_idx').on(t.createdAt),
  ],
)
