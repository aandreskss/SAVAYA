import { db, rawQuery } from '@/shared/lib/db'
import {
  products,
  productVariants,
  productMedia,
  productCollections,
  categories,
  collections,
  colors,
  sizes,
} from '@/domains/catalog/schema'
import { inventory } from '@/domains/inventory/schema'
import { auditLog } from '@/domains/audit-log/schema'
import { eq, inArray, desc, asc, sql, count } from 'drizzle-orm'
import type {
  AdminProductRow,
  AdminProductForEdit,
  AdminCategoryRow,
  AdminCollectionRow,
  ColorOption,
  SizeOption,
  CategoryOption,
  CollectionOption,
  SaveProductPayload,
  SaveCategoryPayload,
  SaveCollectionPayload,
} from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function num(v: unknown): number {
  return Number(v) || 0
}

// ---------------------------------------------------------------------------
// Product list
// ---------------------------------------------------------------------------

export type ListAdminProductsOptions = {
  search?: string
  status?: 'all' | 'published' | 'draft' | 'archived'
  page?: number
  limit?: number
  sku?: string
  colorId?: string
  sizeId?: string
  minPrice?: number
  maxPrice?: number
  minStock?: number
  maxStock?: number
  categoryId?: string
  collectionId?: string
}

export async function listAdminProducts(
  opts: ListAdminProductsOptions = {},
): Promise<{ rows: AdminProductRow[]; total: number }> {
  const page = opts.page ?? 1
  const limit = opts.limit ?? 20
  const offset = (page - 1) * limit

  const searchCondition = opts.search
    ? sql`AND p.name ILIKE ${'%' + opts.search + '%'}`
    : sql``

  const statusCondition = (() => {
    switch (opts.status) {
      case 'published':
        return sql`AND p.is_active = true AND (p.published_at IS NULL OR p.published_at <= NOW())`
      case 'draft':
        return sql`AND p.is_active = true AND p.published_at IS NOT NULL AND p.published_at > NOW()`
      case 'archived':
        return sql`AND p.is_active = false`
      default:
        return sql``
    }
  })()

  const categoryCondition = opts.categoryId
    ? sql`AND p.category_id = ${opts.categoryId}::uuid`
    : sql``

  const collectionCondition = opts.collectionId
    ? sql`AND EXISTS (SELECT 1 FROM product_collections pc WHERE pc.product_id = p.id AND pc.collection_id = ${opts.collectionId}::uuid)`
    : sql``

  const skuCondition = opts.sku
    ? sql`AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.sku ILIKE ${'%' + opts.sku + '%'} AND pv.is_active = true)`
    : sql``

  const colorCondition = opts.colorId
    ? sql`AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.color_id = ${opts.colorId}::uuid AND pv.is_active = true)`
    : sql``

  const sizeCondition = opts.sizeId
    ? sql`AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.size_id = ${opts.sizeId}::uuid AND pv.is_active = true)`
    : sql``

  const minPriceCondition = opts.minPrice !== undefined && opts.minPrice > 0
    ? sql`AND p.base_price >= ${opts.minPrice}`
    : sql``

  const maxPriceCondition = opts.maxPrice !== undefined && opts.maxPrice > 0
    ? sql`AND p.base_price <= ${opts.maxPrice}`
    : sql``

  const stockSub = sql`(
    SELECT COALESCE(SUM(inv.quantity - inv.reserved), 0)
    FROM product_variants pv JOIN inventory inv ON inv.variant_id = pv.id
    WHERE pv.product_id = p.id AND pv.is_active = true
  )`

  const minStockCondition = opts.minStock !== undefined && opts.minStock >= 0
    ? sql`AND ${stockSub} >= ${opts.minStock}`
    : sql``

  const maxStockCondition = opts.maxStock !== undefined && opts.maxStock >= 0
    ? sql`AND ${stockSub} <= ${opts.maxStock}`
    : sql``

  type Row = {
    id: string
    name: string
    slug: string
    base_price: string
    compare_at_price: string | null
    is_active: boolean
    is_featured: boolean
    is_new: boolean
    published_at: Date | null
    category_name: string | null
    primary_image_url: string | null
    variant_count: string
    total_stock: string
    created_at: Date
    total: string
  }

  const rows = await rawQuery<Row>(sql`
    SELECT
      p.id,
      p.name,
      p.slug,
      p.base_price,
      p.compare_at_price,
      p.is_active,
      p.is_featured,
      p.is_new,
      p.published_at,
      c.name AS category_name,
      (
        SELECT m.url FROM product_media m
        WHERE m.product_id = p.id AND m.is_primary = true
        LIMIT 1
      ) AS primary_image_url,
      (
        SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id AND v.is_active = true
      ) AS variant_count,
      (
        SELECT COALESCE(SUM(inv.quantity - inv.reserved), 0)
        FROM product_variants v
        JOIN inventory inv ON inv.variant_id = v.id
        WHERE v.product_id = p.id AND v.is_active = true
      ) AS total_stock,
      p.created_at,
      COUNT(*) OVER () AS total
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE 1=1
    ${searchCondition}
    ${statusCondition}
    ${categoryCondition}
    ${collectionCondition}
    ${skuCondition}
    ${colorCondition}
    ${sizeCondition}
    ${minPriceCondition}
    ${maxPriceCondition}
    ${minStockCondition}
    ${maxStockCondition}
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `)

  if (rows.length === 0) return { rows: [], total: 0 }

  const total = num(rows[0].total)

  return {
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      basePrice: num(r.base_price),
      compareAtPrice: r.compare_at_price !== null ? num(r.compare_at_price) : null,
      isActive: r.is_active,
      isFeatured: r.is_featured,
      isNew: r.is_new,
      publishedAt: r.published_at,
      categoryName: r.category_name,
      primaryImageUrl: r.primary_image_url,
      variantCount: num(r.variant_count),
      totalStock: num(r.total_stock),
      createdAt: r.created_at,
    })),
    total,
  }
}

// ---------------------------------------------------------------------------
// Product for editor
// ---------------------------------------------------------------------------

export async function getAdminProductForEdit(id: string): Promise<AdminProductForEdit | null> {
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      categoryId: products.categoryId,
      gender: products.gender,
      productType: products.productType,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      isActive: products.isActive,
      isFeatured: products.isFeatured,
      isNew: products.isNew,
      tags: products.tags,
      seoTitle: products.seoTitle,
      seoDescription: products.seoDescription,
      seoKeywords: products.seoKeywords,
      metaImageUrl: products.metaImageUrl,
      publishedAt: products.publishedAt,
    })
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!productRows[0]) return null

  const product = productRows[0]

  const [variantRows, mediaRows, collectionRows] = await Promise.all([
    db
      .select({
        id: productVariants.id,
        colorId: colors.id,
        colorName: colors.name,
        colorHex: colors.hex,
        sizeId: sizes.id,
        sizeName: sizes.name,
        sku: productVariants.sku,
        price: productVariants.price,
        compareAtPrice: productVariants.compareAtPrice,
        isActive: productVariants.isActive,
        quantity: inventory.quantity,
        reserved: inventory.reserved,
      })
      .from(productVariants)
      .innerJoin(colors, eq(colors.id, productVariants.colorId))
      .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(eq(productVariants.productId, id))
      .orderBy(asc(colors.name), asc(sizes.sortOrder)),

    db
      .select({
        id: productMedia.id,
        cloudinaryPublicId: productMedia.cloudinaryPublicId,
        url: productMedia.url,
        altText: productMedia.altText,
        isPrimary: productMedia.isPrimary,
        sortOrder: productMedia.sortOrder,
        variantId: productMedia.variantId,
      })
      .from(productMedia)
      .where(eq(productMedia.productId, id))
      .orderBy(desc(productMedia.isPrimary), asc(productMedia.sortOrder)),

    db
      .select({ collectionId: productCollections.collectionId })
      .from(productCollections)
      .where(eq(productCollections.productId, id)),
  ])

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    collectionIds: collectionRows.map((r) => r.collectionId),
    gender: product.gender,
    productType: product.productType,
    basePrice: num(product.basePrice),
    compareAtPrice: product.compareAtPrice !== null ? num(product.compareAtPrice) : null,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    tags: product.tags ?? [],
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    seoKeywords: product.seoKeywords,
    metaImageUrl: product.metaImageUrl,
    publishedAt: product.publishedAt,
    variants: variantRows.map((v) => ({
      id: v.id,
      colorId: v.colorId,
      colorName: v.colorName,
      colorHex: v.colorHex ?? '#888888',
      sizeId: v.sizeId,
      sizeName: v.sizeName,
      sku: v.sku,
      price: num(v.price),
      compareAtPrice: v.compareAtPrice !== null ? num(v.compareAtPrice) : null,
      isActive: v.isActive,
      stock: Math.max(0, num(v.quantity) - num(v.reserved)),
    })),
    media: mediaRows.map((m) => ({
      id: m.id,
      cloudinaryPublicId: m.cloudinaryPublicId,
      url: m.url,
      altText: m.altText,
      isPrimary: m.isPrimary,
      sortOrder: m.sortOrder,
      variantId: m.variantId,
    })),
  }
}

// ---------------------------------------------------------------------------
// Lookup data for form dropdowns
// ---------------------------------------------------------------------------

export async function getAllColors(): Promise<ColorOption[]> {
  const rows = await db
    .select({ id: colors.id, name: colors.name, hex: colors.hex })
    .from(colors)
    .orderBy(asc(colors.name))
  return rows
}

export async function getAllSizes(): Promise<SizeOption[]> {
  const rows = await db
    .select({ id: sizes.id, name: sizes.name, sortOrder: sizes.sortOrder })
    .from(sizes)
    .orderBy(asc(sizes.sortOrder))
  return rows
}

export async function getAllCategoryOptions(): Promise<CategoryOption[]> {
  const rows = await db
    .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name))
  return rows
}

export async function getAllCollectionOptions(): Promise<CollectionOption[]> {
  const rows = await db
    .select({ id: collections.id, name: collections.name })
    .from(collections)
    .where(eq(collections.isActive, true))
    .orderBy(asc(collections.name))
  return rows
}

// ---------------------------------------------------------------------------
// Create product
// ---------------------------------------------------------------------------

export async function createProduct(
  data: SaveProductPayload,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<string> {
  const [product] = await db
    .insert(products)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      categoryId: data.categoryId,
      gender: data.gender,
      productType: data.productType,
      basePrice: String(data.basePrice),
      compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : null,
      isFeatured: data.isFeatured,
      isNew: data.isNew,
      isActive: data.isActive,
      tags: data.tags,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      metaImageUrl: data.metaImageUrl,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
    })
    .returning({ id: products.id })

  const id = product.id

  if (data.collectionIds.length > 0) {
    await db.insert(productCollections).values(
      data.collectionIds.map((collectionId) => ({ productId: id, collectionId })),
    )
  }

  if (data.variants.length > 0) {
    const insertedVariants = await db
      .insert(productVariants)
      .values(
        data.variants.map((v) => ({
          productId: id,
          colorId: v.colorId,
          sizeId: v.sizeId,
          sku: v.sku,
          price: String(v.price),
          compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : null,
          isActive: v.isActive,
        })),
      )
      .returning({ id: productVariants.id })

    await db.insert(inventory).values(
      insertedVariants.map((v, i) => ({
        variantId: v.id,
        quantity: data.variants[i].initialStock,
        reserved: 0,
      })),
    )
  }

  if (data.media.length > 0) {
    await db.insert(productMedia).values(
      data.media.map((m) => ({
        productId: id,
        cloudinaryPublicId: m.cloudinaryPublicId,
        url: m.url,
        altText: m.altText,
        isPrimary: m.isPrimary,
        sortOrder: m.sortOrder,
      })),
    )
  }

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'product.create',
    resourceType: 'product',
    resourceId: id,
    after: { name: data.name, slug: data.slug },
    ip,
  })

  return id
}

// ---------------------------------------------------------------------------
// Update product
// ---------------------------------------------------------------------------

export async function updateProduct(
  id: string,
  data: SaveProductPayload,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  await db
    .update(products)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      categoryId: data.categoryId,
      gender: data.gender,
      productType: data.productType,
      basePrice: String(data.basePrice),
      compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : null,
      isFeatured: data.isFeatured,
      isNew: data.isNew,
      isActive: data.isActive,
      tags: data.tags,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      metaImageUrl: data.metaImageUrl,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))

  // Sync collections
  await db.delete(productCollections).where(eq(productCollections.productId, id))
  if (data.collectionIds.length > 0) {
    await db.insert(productCollections).values(
      data.collectionIds.map((collectionId) => ({ productId: id, collectionId })),
    )
  }

  // Sync variants
  const existingRows = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, id))

  const existingIds = new Set(existingRows.map((r) => r.id))
  const submittedWithIds = data.variants.filter((v) => v.id).map((v) => v.id!)
  const submittedIdSet = new Set(submittedWithIds)

  // Soft-delete removed variants
  const toDeactivate = [...existingIds].filter((eid) => !submittedIdSet.has(eid))
  if (toDeactivate.length > 0) {
    await db
      .update(productVariants)
      .set({ isActive: false, updatedAt: new Date() })
      .where(inArray(productVariants.id, toDeactivate))
  }

  // Update existing variants
  for (const v of data.variants.filter((v) => v.id)) {
    await db
      .update(productVariants)
      .set({
        colorId: v.colorId,
        sizeId: v.sizeId,
        sku: v.sku,
        price: String(v.price),
        compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : null,
        isActive: v.isActive,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, v.id!))
  }

  // Insert new variants
  const newVariants = data.variants.filter((v) => !v.id)
  if (newVariants.length > 0) {
    const inserted = await db
      .insert(productVariants)
      .values(
        newVariants.map((v) => ({
          productId: id,
          colorId: v.colorId,
          sizeId: v.sizeId,
          sku: v.sku,
          price: String(v.price),
          compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : null,
          isActive: v.isActive,
        })),
      )
      .returning({ id: productVariants.id })

    await db.insert(inventory).values(
      inserted.map((v, i) => ({
        variantId: v.id,
        quantity: newVariants[i].initialStock,
        reserved: 0,
      })),
    )
  }

  // Sync media: update existing, insert new
  for (const m of data.media.filter((m) => m.id)) {
    await db
      .update(productMedia)
      .set({ isPrimary: m.isPrimary, sortOrder: m.sortOrder, altText: m.altText })
      .where(eq(productMedia.id, m.id!))
  }

  const newMedia = data.media.filter((m) => !m.id)
  if (newMedia.length > 0) {
    await db.insert(productMedia).values(
      newMedia.map((m) => ({
        productId: id,
        cloudinaryPublicId: m.cloudinaryPublicId,
        url: m.url,
        altText: m.altText,
        isPrimary: m.isPrimary,
        sortOrder: m.sortOrder,
      })),
    )
  }

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'product.update',
    resourceType: 'product',
    resourceId: id,
    after: { name: data.name, slug: data.slug, isActive: data.isActive },
    ip,
  })
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

export async function archiveProduct(
  id: string,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id))
  await db.insert(auditLog).values({ actorId, actorEmail, action: 'product.archive', resourceType: 'product', resourceId: id, ip })
}

export async function restoreProduct(
  id: string,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  await db.update(products).set({ isActive: true, updatedAt: new Date() }).where(eq(products.id, id))
  await db.insert(auditLog).values({ actorId, actorEmail, action: 'product.restore', resourceType: 'product', resourceId: id, ip })
}

export async function publishProduct(
  id: string,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  await db.update(products).set({ publishedAt: new Date(), isActive: true, updatedAt: new Date() }).where(eq(products.id, id))
  await db.insert(auditLog).values({ actorId, actorEmail, action: 'product.publish', resourceType: 'product', resourceId: id, ip })
}

export async function unpublishProduct(
  id: string,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  await db.update(products).set({ publishedAt: null, updatedAt: new Date() }).where(eq(products.id, id))
  await db.insert(auditLog).values({ actorId, actorEmail, action: 'product.unpublish', resourceType: 'product', resourceId: id, ip })
}

export async function duplicateProduct(
  sourceId: string,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<string> {
  const source = await getAdminProductForEdit(sourceId)
  if (!source) throw new Error('Producto no encontrado')

  const baseName = `Copia de ${source.name}`
  const baseSlug = `copia-de-${source.slug}`

  // Find a non-conflicting slug
  const existing = await db
    .select({ slug: products.slug })
    .from(products)
    .where(sql`${products.slug} LIKE ${baseSlug + '%'}`)

  const slugs = new Set(existing.map((r) => r.slug))
  let slug = baseSlug
  let n = 2
  while (slugs.has(slug)) {
    slug = `${baseSlug}-${n}`
    n++
  }

  const [created] = await db
    .insert(products)
    .values({
      name: baseName,
      slug,
      description: source.description,
      categoryId: source.categoryId,
      gender: source.gender,
      productType: source.productType,
      basePrice: String(source.basePrice),
      compareAtPrice: source.compareAtPrice ? String(source.compareAtPrice) : null,
      isFeatured: false,
      isNew: false,
      isActive: false,
      tags: source.tags,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      seoKeywords: source.seoKeywords,
      metaImageUrl: source.metaImageUrl,
      publishedAt: null,
    })
    .returning({ id: products.id })

  const newId = created.id

  if (source.collectionIds.length > 0) {
    await db.insert(productCollections).values(
      source.collectionIds.map((collectionId) => ({ productId: newId, collectionId })),
    )
  }

  if (source.variants.length > 0) {
    const insertedVariants = await db
      .insert(productVariants)
      .values(
        source.variants.map((v) => ({
          productId: newId,
          colorId: v.colorId,
          sizeId: v.sizeId,
          sku: `${v.sku}-C`,
          price: String(v.price),
          compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : null,
          isActive: v.isActive,
        })),
      )
      .returning({ id: productVariants.id })

    await db.insert(inventory).values(
      insertedVariants.map((v) => ({ variantId: v.id, quantity: 0, reserved: 0 })),
    )
  }

  if (source.media.length > 0) {
    await db.insert(productMedia).values(
      source.media.map((m) => ({
        productId: newId,
        cloudinaryPublicId: m.cloudinaryPublicId,
        url: m.url,
        altText: m.altText,
        isPrimary: m.isPrimary,
        sortOrder: m.sortOrder,
      })),
    )
  }

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'product.duplicate',
    resourceType: 'product',
    resourceId: newId,
    before: { sourceId },
    after: { name: baseName, slug },
    ip,
  })

  return newId
}

// ---------------------------------------------------------------------------
// Delete product media record + Cloudinary destroy
// ---------------------------------------------------------------------------

export async function deleteMediaRecord(mediaId: string): Promise<string | null> {
  const rows = await db
    .select({ cloudinaryPublicId: productMedia.cloudinaryPublicId })
    .from(productMedia)
    .where(eq(productMedia.id, mediaId))
    .limit(1)

  if (!rows[0]) return null
  const { cloudinaryPublicId } = rows[0]

  await db.delete(productMedia).where(eq(productMedia.id, mediaId))
  return cloudinaryPublicId
}

// ---------------------------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------------------------

export async function listAdminCategories(): Promise<AdminCategoryRow[]> {
  type Row = {
    id: string
    name: string
    slug: string
    parent_id: string | null
    parent_name: string | null
    is_active: boolean
    sort_order: number
    product_count: string
  }

  const rows = await rawQuery<Row>(sql`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.parent_id,
      p.name AS parent_name,
      c.is_active,
      c.sort_order,
      (SELECT COUNT(*) FROM products pr WHERE pr.category_id = c.id AND pr.is_active = true) AS product_count
    FROM categories c
    LEFT JOIN categories p ON p.id = c.parent_id
    ORDER BY c.sort_order ASC, c.name ASC
  `)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    parentId: r.parent_id,
    parentName: r.parent_name,
    isActive: r.is_active,
    sortOrder: r.sort_order,
    productCount: num(r.product_count),
  }))
}

export async function getAdminCategory(id: string) {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function createCategory(
  data: SaveCategoryPayload,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<string> {
  const [created] = await db
    .insert(categories)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    })
    .returning({ id: categories.id })

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'category.create',
    resourceType: 'category',
    resourceId: created.id,
    after: { name: data.name, slug: data.slug },
    ip,
  })

  return created.id
}

export async function updateCategory(
  id: string,
  data: SaveCategoryPayload,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  await db
    .update(categories)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'category.update',
    resourceType: 'category',
    resourceId: id,
    after: { name: data.name, slug: data.slug },
    ip,
  })
}

export async function deleteCategory(
  id: string,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  // Check no products are assigned
  const [{ n }] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.categoryId, id))

  if (n > 0) {
    throw new Error(`Esta categoría tiene ${n} producto(s) asignado(s). Reasígnalos antes de eliminar.`)
  }

  await db.delete(categories).where(eq(categories.id, id))

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'category.delete',
    resourceType: 'category',
    resourceId: id,
    ip,
  })
}

// ---------------------------------------------------------------------------
// Collection CRUD
// ---------------------------------------------------------------------------

export async function listAdminCollections(): Promise<AdminCollectionRow[]> {
  type Row = {
    id: string
    name: string
    slug: string
    is_active: boolean
    is_featured: boolean
    starts_at: Date | null
    ends_at: Date | null
    product_count: string
  }

  const rows = await rawQuery<Row>(sql`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.is_active,
      c.is_featured,
      c.starts_at,
      c.ends_at,
      (SELECT COUNT(*) FROM product_collections pc WHERE pc.collection_id = c.id) AS product_count
    FROM collections c
    ORDER BY c.name ASC
  `)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    isActive: r.is_active,
    isFeatured: r.is_featured,
    productCount: num(r.product_count),
    startsAt: r.starts_at,
    endsAt: r.ends_at,
  }))
}

export async function getAdminCollection(id: string) {
  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1)
  return rows[0] ?? null
}

export async function createCollection(
  data: SaveCollectionPayload,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<string> {
  const [created] = await db
    .insert(collections)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    })
    .returning({ id: collections.id })

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'collection.create',
    resourceType: 'collection',
    resourceId: created.id,
    after: { name: data.name, slug: data.slug },
    ip,
  })

  return created.id
}

export async function updateCollection(
  id: string,
  data: SaveCollectionPayload,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  await db
    .update(collections)
    .set({
      name: data.name,
      slug: data.slug,
      description: data.description,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(collections.id, id))

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'collection.update',
    resourceType: 'collection',
    resourceId: id,
    after: { name: data.name, slug: data.slug },
    ip,
  })
}

export async function deleteCollection(
  id: string,
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  await db.delete(productCollections).where(eq(productCollections.collectionId, id))
  await db.delete(collections).where(eq(collections.id, id))

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'collection.delete',
    resourceType: 'collection',
    resourceId: id,
    ip,
  })
}

// ---------------------------------------------------------------------------
// Collection product management
// ---------------------------------------------------------------------------

export type CollectionProductSummary = {
  id: string
  name: string
  slug: string
  primaryImageUrl: string | null
  basePrice: number
}

export async function getAdminCollectionProducts(
  collectionId: string,
): Promise<CollectionProductSummary[]> {
  type Row = {
    id: string
    name: string
    slug: string
    base_price: string
    primary_image_url: string | null
  }

  const rows = await rawQuery<Row>(sql`
    SELECT
      p.id,
      p.name,
      p.slug,
      p.base_price,
      (
        SELECT m.url FROM product_media m
        WHERE m.product_id = p.id AND m.is_primary = true
        LIMIT 1
      ) AS primary_image_url
    FROM products p
    INNER JOIN product_collections pc ON pc.product_id = p.id
    WHERE pc.collection_id = ${collectionId}
    AND p.is_active = true
    ORDER BY p.name ASC
  `)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    basePrice: num(r.base_price),
    primaryImageUrl: r.primary_image_url,
  }))
}

export async function setCollectionProducts(
  collectionId: string,
  productIds: string[],
  actorId: string,
  actorEmail: string,
  ip: string,
): Promise<void> {
  await db.delete(productCollections).where(eq(productCollections.collectionId, collectionId))

  if (productIds.length > 0) {
    await db.insert(productCollections).values(
      productIds.map((productId) => ({ productId, collectionId })),
    )
  }

  await db.insert(auditLog).values({
    actorId,
    actorEmail,
    action: 'collection.set_products',
    resourceType: 'collection',
    resourceId: collectionId,
    after: { productIds },
    ip,
  })
}

export async function searchProductsForCollection(query: string): Promise<CollectionProductSummary[]> {
  if (!query.trim()) return []

  type Row = {
    id: string
    name: string
    slug: string
    base_price: string
    primary_image_url: string | null
  }

  const rows = await rawQuery<Row>(sql`
    SELECT
      p.id,
      p.name,
      p.slug,
      p.base_price,
      (
        SELECT m.url FROM product_media m
        WHERE m.product_id = p.id AND m.is_primary = true
        LIMIT 1
      ) AS primary_image_url
    FROM products p
    WHERE p.is_active = true
    AND p.name ILIKE ${'%' + query + '%'}
    ORDER BY p.name ASC
    LIMIT 20
  `)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    basePrice: num(r.base_price),
    primaryImageUrl: r.primary_image_url,
  }))
}
