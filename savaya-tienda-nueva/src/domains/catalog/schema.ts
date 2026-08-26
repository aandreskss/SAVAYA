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
  primaryKey,
  uniqueIndex,
  check,
  foreignKey,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { customers } from '@/domains/customers/schema'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const genderEnum = pgEnum('gender', ['women', 'men', 'unisex'])

export const mediaTypeEnum = pgEnum('media_type', ['image', 'video'])

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    parentId: uuid('parent_id'),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Self-referential FK via foreignKey() — avoids circular TypeScript reference
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
      name: 'categories_parent_id_fk',
    }).onDelete('set null'),
    index('categories_is_active_idx').on(t.isActive),
    index('categories_parent_id_idx').on(t.parentId),
    index('categories_sort_order_idx').on(t.sortOrder),
  ],
)

export const collections = pgTable(
  'collections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('collections_is_active_idx').on(t.isActive),
    index('collections_is_featured_idx').on(t.isFeatured),
    index('collections_starts_at_ends_at_idx').on(t.startsAt, t.endsAt),
  ],
)

export const colors = pgTable('colors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  hex: text('hex'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sizes = pgTable('sizes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    gender: genderEnum('gender').notNull().default('women'),
    productType: text('product_type').notNull().default('shoes'),
    basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: numeric('compare_at_price', { precision: 10, scale: 2 }),
    isActive: boolean('is_active').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),
    isNew: boolean('is_new').notNull().default(false),
    tags: text('tags').array(),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    seoKeywords: text('seo_keywords'),
    metaImageUrl: text('meta_image_url'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('products_is_active_idx').on(t.isActive),
    index('products_is_featured_idx').on(t.isFeatured),
    index('products_is_new_idx').on(t.isNew),
    index('products_category_id_idx').on(t.categoryId),
    index('products_gender_idx').on(t.gender),
    index('products_published_at_idx').on(t.publishedAt),
  ],
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    colorId: uuid('color_id')
      .notNull()
      .references(() => colors.id, { onDelete: 'restrict' }),
    sizeId: uuid('size_id')
      .notNull()
      .references(() => sizes.id, { onDelete: 'restrict' }),
    sku: text('sku').unique().notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    compareAtPrice: numeric('compare_at_price', { precision: 10, scale: 2 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('product_variants_product_color_size_idx').on(
      t.productId,
      t.colorId,
      t.sizeId,
    ),
    index('product_variants_product_id_idx').on(t.productId),
    index('product_variants_is_active_idx').on(t.isActive),
    index('product_variants_color_id_idx').on(t.colorId),
    index('product_variants_size_id_idx').on(t.sizeId),
  ],
)

export const productMedia = pgTable(
  'product_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, {
      onDelete: 'set null',
    }),
    colorId: uuid('color_id').references(() => colors.id, {
      onDelete: 'set null',
    }),
    cloudinaryPublicId: text('cloudinary_public_id').notNull(),
    url: text('url').notNull(),
    altText: text('alt_text'),
    type: mediaTypeEnum('type').notNull().default('image'),
    sortOrder: integer('sort_order').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    // append-only — no updatedAt
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('product_media_product_id_idx').on(t.productId),
    index('product_media_variant_id_idx').on(t.variantId),
    index('product_media_is_primary_idx').on(t.productId, t.isPrimary),
  ],
)

export const productCollections = pgTable(
  'product_collections',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.collectionId] })],
)

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    productVariantId: uuid('product_variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.customerId, t.productVariantId] })],
)

// ---------------------------------------------------------------------------
// Self-referential FK for categories.parentId (added after table declaration)
// ---------------------------------------------------------------------------

// Note: Drizzle does not support inline self-referential FK in the column
// definition for pgTable when using the table callback form. We define it
// via the relations layer and rely on the migration SQL to carry the correct
// FK. The FK is declared here using `.references()` below through a workaround
// — actually Drizzle supports it via a function reference. Let's keep it clean
// by defining a separate relation object that Drizzle introspects.

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories',
  }),
  subcategories: many(categories, { relationName: 'subcategories' }),
  products: many(products),
}))

export const collectionsRelations = relations(collections, ({ many }) => ({
  productCollections: many(productCollections),
}))

export const colorsRelations = relations(colors, ({ many }) => ({
  productVariants: many(productVariants),
}))

export const sizesRelations = relations(sizes, ({ many }) => ({
  productVariants: many(productVariants),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  media: many(productMedia),
  productCollections: many(productCollections),
}))

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  color: one(colors, { fields: [productVariants.colorId], references: [colors.id] }),
  size: one(sizes, { fields: [productVariants.sizeId], references: [sizes.id] }),
  media: many(productMedia),
  wishlistItems: many(wishlistItems),
}))

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, { fields: [productMedia.productId], references: [products.id] }),
  variant: one(productVariants, {
    fields: [productMedia.variantId],
    references: [productVariants.id],
  }),
}))

export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  product: one(products, {
    fields: [productCollections.productId],
    references: [products.id],
  }),
  collection: one(collections, {
    fields: [productCollections.collectionId],
    references: [collections.id],
  }),
}))

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  customer: one(customers, {
    fields: [wishlistItems.customerId],
    references: [customers.id],
  }),
  productVariant: one(productVariants, {
    fields: [wishlistItems.productVariantId],
    references: [productVariants.id],
  }),
}))
