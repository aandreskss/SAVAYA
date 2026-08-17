import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const pageSectionTypeEnum = pgEnum('page_section_type', [
  'announcement_bar',
  'hero',
  'shop_by_category',
  'product_carousel',
  'editorial_block',
  'split_block',
  'benefits_block',
  'newsletter',
  'banner_row',
])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').unique().notNull(),
    title: text('title').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('pages_is_active_idx').on(t.isActive)],
)

export const pageSections = pgTable(
  'page_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pageId: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    type: pageSectionTypeEnum('type').notNull(),
    content: jsonb('content').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('page_sections_page_id_idx').on(t.pageId),
    index('page_sections_is_active_sort_idx').on(t.pageId, t.isActive, t.sortOrder),
  ],
)

export const banners = pgTable(
  'banners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    imageDesktopUrl: text('image_desktop_url').notNull(),
    imageMobileUrl: text('image_mobile_url').notNull(),
    ctaText: text('cta_text'),
    ctaUrl: text('cta_url'),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('banners_is_active_idx').on(t.isActive),
    index('banners_starts_at_ends_at_idx').on(t.startsAt, t.endsAt),
    index('banners_sort_order_idx').on(t.sortOrder),
  ],
)

export const popups = pgTable(
  'popups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    imageUrl: text('image_url').notNull(),
    ctaText: text('cta_text'),
    ctaUrl: text('cta_url'),
    delaySeconds: integer('delay_seconds').notNull().default(5),
    showOnPages: text('show_on_pages').array(),
    maxShowsPerSession: integer('max_shows_per_session').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('popups_is_active_idx').on(t.isActive),
    index('popups_starts_at_ends_at_idx').on(t.startsAt, t.endsAt),
  ],
)

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const pagesRelations = relations(pages, ({ many }) => ({
  sections: many(pageSections),
}))

export const pageSectionsRelations = relations(pageSections, ({ one }) => ({
  page: one(pages, { fields: [pageSections.pageId], references: [pages.id] }),
}))
