import { db } from '@/shared/lib/db'
import {
  products,
  productVariants,
  categories,
  colors,
  sizes,
  productMedia,
  productCollections,
  collections,
} from './schema'
import { inventory } from '@/domains/inventory/schema'
import {
  eq,
  and,
  inArray,
  gte,
  lte,
  sql,
  desc,
  asc,
  gt,
  count,
  ne,
} from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductFilters = {
  categorySlug?: string
  gender?: 'women' | 'men' | 'unisex'
  colorIds?: string[]
  sizeIds?: string[]
  minPrice?: number
  maxPrice?: number
  onlyAvailable?: boolean
  onlyNew?: boolean
  onlyOnSale?: boolean
  collectionSlug?: string
  sortBy?: 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'bestseller'
  page?: number
  limit?: number
}

export type ProductListItem = {
  id: string
  name: string
  slug: string
  basePrice: number
  compareAtPrice: number | null
  isNew: boolean
  isFeatured: boolean
  availableColors: { id: string; name: string; hex: string }[]
  images: { url: string; alt: string }[]
  hasStock: boolean
}

export type AvailableFilters = {
  colors: { id: string; name: string; hex: string }[]
  sizes: { id: string; name: string }[]
  priceRange: { min: number; max: number }
}

// ---------------------------------------------------------------------------
// Fallback de desarrollo (sin DATABASE_URL)
// ---------------------------------------------------------------------------

const DEV_PRODUCTS: ProductListItem[] = [
  {
    id: 'dev-001',
    name: 'Sandalia Dorada Canela',
    slug: 'sandalia-dorada-canela',
    basePrice: 48,
    compareAtPrice: null,
    isNew: true,
    isFeatured: true,
    availableColors: [
      { id: 'c1', name: 'Dorado', hex: '#C9A84C' },
      { id: 'c2', name: 'Plateado', hex: '#A8A8A8' },
    ],
    images: [
      { url: 'https://placehold.co/480x640/f5efe6/c9a84c?text=SAVAYA', alt: 'Sandalia Dorada Canela' },
    ],
    hasStock: true,
  },
  {
    id: 'dev-002',
    name: 'Tacón Nude Elegante',
    slug: 'tacon-nude-elegante',
    basePrice: 65,
    compareAtPrice: 80,
    isNew: false,
    isFeatured: true,
    availableColors: [
      { id: 'c3', name: 'Nude', hex: '#D4A689' },
    ],
    images: [
      { url: 'https://placehold.co/480x640/f5efe6/8b7355?text=SAVAYA', alt: 'Tacón Nude Elegante' },
    ],
    hasStock: true,
  },
  {
    id: 'dev-003',
    name: 'Plataforma Negra Classic',
    slug: 'plataforma-negra-classic',
    basePrice: 72,
    compareAtPrice: null,
    isNew: true,
    isFeatured: false,
    availableColors: [
      { id: 'c4', name: 'Negro', hex: '#1C1C1E' },
    ],
    images: [
      { url: 'https://placehold.co/480x640/1c1c1e/ffffff?text=SAVAYA', alt: 'Plataforma Negra Classic' },
    ],
    hasStock: true,
  },
  {
    id: 'dev-004',
    name: 'Flat Cuero Camel',
    slug: 'flat-cuero-camel',
    basePrice: 55,
    compareAtPrice: 70,
    isNew: false,
    isFeatured: false,
    availableColors: [
      { id: 'c5', name: 'Camel', hex: '#C19A6B' },
      { id: 'c6', name: 'Blanco', hex: '#FAFAFA' },
    ],
    images: [
      { url: 'https://placehold.co/480x640/f5efe6/c19a6b?text=SAVAYA', alt: 'Flat Cuero Camel' },
    ],
    hasStock: true,
  },
  {
    id: 'dev-005',
    name: 'Bota Ankle Dorado Noche',
    slug: 'bota-ankle-dorado-noche',
    basePrice: 90,
    compareAtPrice: null,
    isNew: true,
    isFeatured: true,
    availableColors: [
      { id: 'c1', name: 'Dorado', hex: '#C9A84C' },
      { id: 'c4', name: 'Negro', hex: '#1C1C1E' },
    ],
    images: [
      { url: 'https://placehold.co/480x640/2c2c2e/c9a84c?text=SAVAYA', alt: 'Bota Ankle Dorado Noche' },
    ],
    hasStock: true,
  },
  {
    id: 'dev-006',
    name: 'Sneaker Blanco Premium',
    slug: 'sneaker-blanco-premium',
    basePrice: 82,
    compareAtPrice: null,
    isNew: false,
    isFeatured: false,
    availableColors: [
      { id: 'c6', name: 'Blanco', hex: '#FAFAFA' },
    ],
    images: [
      { url: 'https://placehold.co/480x640/fafafa/1c1c1e?text=SAVAYA', alt: 'Sneaker Blanco Premium' },
    ],
    hasStock: false,
  },
  {
    id: 'dev-007',
    name: 'Sandalia Tiras Nude',
    slug: 'sandalia-tiras-nude',
    basePrice: 43,
    compareAtPrice: 58,
    isNew: false,
    isFeatured: false,
    availableColors: [
      { id: 'c3', name: 'Nude', hex: '#D4A689' },
    ],
    images: [
      { url: 'https://placehold.co/480x640/f5efe6/d4a689?text=SAVAYA', alt: 'Sandalia Tiras Nude' },
    ],
    hasStock: true,
  },
  {
    id: 'dev-008',
    name: 'Tacón Stiletto Negro',
    slug: 'tacon-stiletto-negro',
    basePrice: 78,
    compareAtPrice: null,
    isNew: true,
    isFeatured: true,
    availableColors: [
      { id: 'c4', name: 'Negro', hex: '#1C1C1E' },
    ],
    images: [
      { url: 'https://placehold.co/480x640/1c1c1e/ffffff?text=SAVAYA', alt: 'Tacón Stiletto Negro' },
    ],
    hasStock: true,
  },
]

function applyDevFilters(
  items: ProductListItem[],
  filters: ProductFilters,
): ProductListItem[] {
  let result = [...items]

  if (filters.onlyNew) result = result.filter((p) => p.isNew)
  if (filters.onlyOnSale) result = result.filter((p) => p.compareAtPrice !== null)
  if (filters.onlyAvailable) result = result.filter((p) => p.hasStock)
  if (filters.colorIds?.length) {
    result = result.filter((p) =>
      p.availableColors.some((c) => filters.colorIds!.includes(c.id)),
    )
  }
  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.basePrice >= filters.minPrice!)
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => p.basePrice <= filters.maxPrice!)
  }

  // Sort
  switch (filters.sortBy) {
    case 'newest':
      result = result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
      break
    case 'price_asc':
      result = result.sort((a, b) => a.basePrice - b.basePrice)
      break
    case 'price_desc':
      result = result.sort((a, b) => b.basePrice - a.basePrice)
      break
    default:
      // featured: isFeatured first
      result = result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
  }

  return result
}

async function getDevFallbackProducts(
  filters: ProductFilters,
): Promise<{ items: ProductListItem[]; total: number }> {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 24
  const filtered = applyDevFilters(DEV_PRODUCTS, filters)
  const total = filtered.length
  const offset = (page - 1) * limit
  const items = filtered.slice(offset, offset + limit)
  return { items, total }
}

// ---------------------------------------------------------------------------
// getProducts
// ---------------------------------------------------------------------------

export async function getProducts(
  filters: ProductFilters,
): Promise<{ items: ProductListItem[]; total: number }> {
  if (!process.env.DATABASE_URL) {
    return getDevFallbackProducts(filters)
  }

  const page = filters.page ?? 1
  const limit = filters.limit ?? 24
  const offset = (page - 1) * limit

  // Build where conditions
  const conditions: import('drizzle-orm').SQL[] = []

  conditions.push(eq(products.isActive, true))
  // Only return published products (publishedAt null = always visible)
  conditions.push(sql`(${products.publishedAt} IS NULL OR ${products.publishedAt} <= NOW())`)

  if (filters.gender) {
    conditions.push(eq(products.gender, filters.gender))
  }

  if (filters.onlyNew) {
    conditions.push(eq(products.isNew, true))
  }

  if (filters.onlyOnSale) {
    // Has a compareAtPrice set (discount exists)
    conditions.push(sql`${products.compareAtPrice} IS NOT NULL`)
  }

  if (filters.minPrice !== undefined) {
    conditions.push(gte(products.basePrice, String(filters.minPrice)))
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(lte(products.basePrice, String(filters.maxPrice)))
  }

  // Category filter — requires join with categories
  if (filters.categorySlug) {
    const cat = await getCategoryBySlug(filters.categorySlug)
    if (!cat) return { items: [], total: 0 }
    conditions.push(eq(products.categoryId, cat.id))
  }

  // Collection filter — requires join with productCollections
  let collectionId: string | undefined
  if (filters.collectionSlug) {
    const coll = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.slug, filters.collectionSlug), eq(collections.isActive, true)))
      .limit(1)
    if (coll.length === 0) return { items: [], total: 0 }
    collectionId = coll[0].id
  }

  // Color / size filters — require variants subquery
  let variantFilteredProductIds: string[] | undefined

  if (
    (filters.colorIds && filters.colorIds.length > 0) ||
    (filters.sizeIds && filters.sizeIds.length > 0) ||
    filters.onlyAvailable ||
    collectionId
  ) {
    // Build variant query to get matching productIds
    const variantConditions: ReturnType<typeof eq>[] = [eq(productVariants.isActive, true)]

    if (filters.colorIds && filters.colorIds.length > 0) {
      variantConditions.push(inArray(productVariants.colorId, filters.colorIds))
    }

    if (filters.sizeIds && filters.sizeIds.length > 0) {
      variantConditions.push(inArray(productVariants.sizeId, filters.sizeIds))
    }

    if (collectionId) {
      // Get product IDs in collection first
      const collProductRows = await db
        .select({ productId: productCollections.productId })
        .from(productCollections)
        .where(eq(productCollections.collectionId, collectionId))

      const collProductIds = collProductRows.map((r) => r.productId)
      if (collProductIds.length === 0) return { items: [], total: 0 }
      variantConditions.push(inArray(productVariants.productId, collProductIds))
    }

    if (filters.onlyAvailable) {
      // Join with inventory — only variants with available stock
      const availableVariants = await db
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .innerJoin(inventory, eq(inventory.variantId, productVariants.id))
        .where(
          and(
            ...variantConditions,
            gt(sql`${inventory.quantity} - ${inventory.reserved}`, 0),
          ),
        )
        .groupBy(productVariants.productId)

      variantFilteredProductIds = availableVariants.map((v) => v.productId)
    } else {
      const variantRows = await db
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .where(and(...variantConditions))
        .groupBy(productVariants.productId)

      variantFilteredProductIds = variantRows.map((v) => v.productId)
    }

    if (variantFilteredProductIds.length === 0) return { items: [], total: 0 }
    conditions.push(inArray(products.id, variantFilteredProductIds))
  }

  // Sort expression
  const sortExpressions = (() => {
    switch (filters.sortBy) {
      case 'newest':
        return [desc(products.publishedAt)]
      case 'price_asc':
        return [asc(products.basePrice)]
      case 'price_desc':
        return [desc(products.basePrice)]
      case 'bestseller':
        // No order_count available yet — fall back to featured
        return [desc(products.isFeatured), desc(products.publishedAt)]
      default: // featured
        return [desc(products.isFeatured), desc(products.publishedAt)]
    }
  })()

  const whereClause = and(...conditions)

  // Count total
  const [{ total }] = await db
    .select({ total: count() })
    .from(products)
    .where(whereClause)

  // Fetch paginated products
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
      isFeatured: products.isFeatured,
    })
    .from(products)
    .where(whereClause)
    .orderBy(...sortExpressions)
    .limit(limit)
    .offset(offset)

  if (rows.length === 0) return { items: [], total: Number(total) }

  const productIds = rows.map((r) => r.id)

  // Fetch media (primary images first, max 2 per product)
  const mediaRows = await db
    .select({
      productId: productMedia.productId,
      url: productMedia.url,
      altText: productMedia.altText,
      isPrimary: productMedia.isPrimary,
      sortOrder: productMedia.sortOrder,
    })
    .from(productMedia)
    .where(and(inArray(productMedia.productId, productIds), eq(productMedia.type, 'image')))
    .orderBy(desc(productMedia.isPrimary), asc(productMedia.sortOrder))

  // Fetch available colors per product (via active variants)
  const colorRows = await db
    .select({
      productId: productVariants.productId,
      colorId: colors.id,
      colorName: colors.name,
      colorHex: colors.hex,
    })
    .from(productVariants)
    .innerJoin(colors, eq(colors.id, productVariants.colorId))
    .where(
      and(
        inArray(productVariants.productId, productIds),
        eq(productVariants.isActive, true),
      ),
    )
    .groupBy(productVariants.productId, colors.id, colors.name, colors.hex)

  // Fetch stock status per product (any variant with available stock)
  const stockRows = await db
    .select({
      productId: productVariants.productId,
    })
    .from(productVariants)
    .innerJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(
      and(
        inArray(productVariants.productId, productIds),
        eq(productVariants.isActive, true),
        gt(sql`${inventory.quantity} - ${inventory.reserved}`, 0),
      ),
    )
    .groupBy(productVariants.productId)

  // Build maps
  const mediaByProduct = new Map<string, { url: string; alt: string }[]>()
  for (const m of mediaRows) {
    const existing = mediaByProduct.get(m.productId) ?? []
    if (existing.length < 2) {
      existing.push({ url: m.url, alt: m.altText ?? '' })
      mediaByProduct.set(m.productId, existing)
    }
  }

  const colorsByProduct = new Map<string, { id: string; name: string; hex: string }[]>()
  for (const c of colorRows) {
    const existing = colorsByProduct.get(c.productId) ?? []
    if (!existing.find((e) => e.id === c.colorId)) {
      existing.push({ id: c.colorId, name: c.colorName, hex: c.colorHex ?? '#888888' })
      colorsByProduct.set(c.productId, existing)
    }
  }

  const hasStockSet = new Set(stockRows.map((s) => s.productId))

  const items: ProductListItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    basePrice: Number(row.basePrice),
    compareAtPrice: row.compareAtPrice !== null ? Number(row.compareAtPrice) : null,
    isNew: row.isNew,
    isFeatured: row.isFeatured,
    availableColors: colorsByProduct.get(row.id) ?? [],
    images: mediaByProduct.get(row.id) ?? [],
    hasStock: hasStockSet.has(row.id),
  }))

  return { items, total: Number(total) }
}

// ---------------------------------------------------------------------------
// getCategoryBySlug
// ---------------------------------------------------------------------------

export type Category = typeof categories.$inferSelect & {
  seoTitle?: string | null
  seoDescription?: string | null
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!process.env.DATABASE_URL) {
    // Dev fallback categories
    const devCategories: Category[] = [
      {
        id: 'cat-001',
        name: 'Mujer',
        slug: 'mujer',
        description: 'Colección completa de calzado para mujer',
        parentId: null,
        imageUrl: null,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        seoTitle: 'Calzado Mujer — SAVAYA',
        seoDescription: 'Descubre nuestra exclusiva colección de calzado femenino venezolano',
      },
      {
        id: 'cat-002',
        name: 'Sandalias',
        slug: 'sandalias',
        description: 'Sandalias para toda ocasión',
        parentId: 'cat-001',
        imageUrl: null,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        seoTitle: null,
        seoDescription: null,
      },
      {
        id: 'cat-003',
        name: 'Tacones',
        slug: 'tacones',
        description: 'Tacones de autor venezolano',
        parentId: 'cat-001',
        imageUrl: null,
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        seoTitle: null,
        seoDescription: null,
      },
    ]
    return devCategories.find((c) => c.slug === slug) ?? null
  }

  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1)

  return (rows[0] as Category) ?? null
}

// ---------------------------------------------------------------------------
// getCollectionBySlug
// ---------------------------------------------------------------------------

export type CollectionDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
}

export async function getCollectionBySlug(slug: string): Promise<CollectionDetail | null> {
  if (!process.env.DATABASE_URL) return null

  const rows = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      description: collections.description,
      imageUrl: collections.imageUrl,
    })
    .from(collections)
    .where(and(eq(collections.slug, slug), eq(collections.isActive, true)))
    .limit(1)

  return rows[0] ?? null
}

// ---------------------------------------------------------------------------
// getAvailableFilters
// ---------------------------------------------------------------------------

export async function getAvailableFilters(categorySlug?: string): Promise<AvailableFilters> {
  if (!process.env.DATABASE_URL) {
    return {
      colors: [
        { id: 'c1', name: 'Dorado', hex: '#C9A84C' },
        { id: 'c2', name: 'Plateado', hex: '#A8A8A8' },
        { id: 'c3', name: 'Nude', hex: '#D4A689' },
        { id: 'c4', name: 'Negro', hex: '#1C1C1E' },
        { id: 'c5', name: 'Camel', hex: '#C19A6B' },
        { id: 'c6', name: 'Blanco', hex: '#FAFAFA' },
      ],
      sizes: [
        { id: 's1', name: '35' },
        { id: 's2', name: '36' },
        { id: 's3', name: '37' },
        { id: 's4', name: '38' },
        { id: 's5', name: '39' },
        { id: 's6', name: '40' },
        { id: 's7', name: '41' },
      ],
      priceRange: { min: 43, max: 90 },
    }
  }

  // Build base product condition
  const productConditions: ReturnType<typeof eq>[] = [eq(products.isActive, true)]

  if (categorySlug) {
    const cat = await getCategoryBySlug(categorySlug)
    if (cat) {
      productConditions.push(eq(products.categoryId, cat.id))
    }
  }

  // Get product IDs for this category scope
  const scopedProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(and(...productConditions))

  if (scopedProducts.length === 0) {
    return { colors: [], sizes: [], priceRange: { min: 0, max: 999 } }
  }

  const productIds = scopedProducts.map((p) => p.id)

  // Colors available in this scope
  const colorRows = await db
    .select({
      id: colors.id,
      name: colors.name,
      hex: colors.hex,
    })
    .from(colors)
    .innerJoin(productVariants, eq(productVariants.colorId, colors.id))
    .where(
      and(
        inArray(productVariants.productId, productIds),
        eq(productVariants.isActive, true),
      ),
    )
    .groupBy(colors.id, colors.name, colors.hex)
    .orderBy(asc(colors.name))

  // Sizes available in this scope
  const sizeRows = await db
    .select({
      id: sizes.id,
      name: sizes.name,
    })
    .from(sizes)
    .innerJoin(productVariants, eq(productVariants.sizeId, sizes.id))
    .where(
      and(
        inArray(productVariants.productId, productIds),
        eq(productVariants.isActive, true),
      ),
    )
    .groupBy(sizes.id, sizes.name, sizes.sortOrder)
    .orderBy(asc(sizes.sortOrder))

  // Price range
  const [priceRow] = await db
    .select({
      minPrice: sql<string>`min(${products.basePrice})`,
      maxPrice: sql<string>`max(${products.basePrice})`,
    })
    .from(products)
    .where(and(...productConditions))

  return {
    colors: colorRows.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex ?? '#888888',
    })),
    sizes: sizeRows.map((s) => ({ id: s.id, name: s.name })),
    priceRange: {
      min: priceRow ? Math.floor(Number(priceRow.minPrice)) : 0,
      max: priceRow ? Math.ceil(Number(priceRow.maxPrice)) : 999,
    },
  }
}

// ---------------------------------------------------------------------------
// ProductDetail type
// ---------------------------------------------------------------------------

export type ProductDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  compareAtPrice: number | null
  isNew: boolean
  isFeatured: boolean
  gender: string
  category: { id: string; name: string; slug: string } | null
  tags: string[]
  seoTitle: string | null
  seoDescription: string | null
  variants: {
    id: string
    sku: string
    price: number
    compareAtPrice: number | null
    color: { id: string; name: string; hex: string }
    size: { id: string; name: string }
    isActive: boolean
    stock: number       // inventory.quantity - inventory.reserved
    isAvailable: boolean // stock > 0 && isActive
  }[]
  images: {
    id: string
    url: string
    altText: string | null
    isPrimary: boolean
    variantId: string | null
    type: 'image' | 'video'
    sortOrder: number
  }[]
}

// ---------------------------------------------------------------------------
// Dev fallback — producto mock completo
// ---------------------------------------------------------------------------

const DEV_PRODUCT_DETAIL: ProductDetail = {
  id: 'dev-pdp-001',
  name: 'Sandalia Punta Fina',
  slug: 'sandalia-punta-fina',
  description:
    'Sandalia de diseño fino con correa ajustable en el tobillo. Confeccionada en cuero genuino venezolano, ideal para ocasiones especiales y uso casual elegante.',
  basePrice: 45,
  compareAtPrice: 60,
  isNew: true,
  isFeatured: true,
  gender: 'women',
  category: { id: 'cat-002', name: 'Sandalias', slug: 'sandalias' },
  tags: ['sandalia', 'cuero', 'verano'],
  seoTitle: 'Sandalia Punta Fina — SAVAYA',
  seoDescription:
    'Sandalia de punta fina en cuero venezolano. Disponible en Negro y Beige, tallas 36-39.',
  variants: [
    // Negro 36
    {
      id: 'var-n36',
      sku: 'SPF-NEG-36',
      price: 45,
      compareAtPrice: 60,
      color: { id: 'c4', name: 'Negro', hex: '#1C1C1E' },
      size: { id: 's2', name: '36' },
      isActive: true,
      stock: 3,
      isAvailable: true,
    },
    // Negro 37
    {
      id: 'var-n37',
      sku: 'SPF-NEG-37',
      price: 45,
      compareAtPrice: 60,
      color: { id: 'c4', name: 'Negro', hex: '#1C1C1E' },
      size: { id: 's3', name: '37' },
      isActive: true,
      stock: 5,
      isAvailable: true,
    },
    // Negro 38
    {
      id: 'var-n38',
      sku: 'SPF-NEG-38',
      price: 45,
      compareAtPrice: 60,
      color: { id: 'c4', name: 'Negro', hex: '#1C1C1E' },
      size: { id: 's4', name: '38' },
      isActive: true,
      stock: 0,
      isAvailable: false,
    },
    // Negro 39
    {
      id: 'var-n39',
      sku: 'SPF-NEG-39',
      price: 45,
      compareAtPrice: 60,
      color: { id: 'c4', name: 'Negro', hex: '#1C1C1E' },
      size: { id: 's5', name: '39' },
      isActive: true,
      stock: 2,
      isAvailable: true,
    },
    // Beige 36
    {
      id: 'var-b36',
      sku: 'SPF-BEI-36',
      price: 45,
      compareAtPrice: 60,
      color: { id: 'c7', name: 'Beige', hex: '#E8D5B7' },
      size: { id: 's2', name: '36' },
      isActive: true,
      stock: 4,
      isAvailable: true,
    },
    // Beige 37
    {
      id: 'var-b37',
      sku: 'SPF-BEI-37',
      price: 45,
      compareAtPrice: 60,
      color: { id: 'c7', name: 'Beige', hex: '#E8D5B7' },
      size: { id: 's3', name: '37' },
      isActive: true,
      stock: 1,
      isAvailable: true,
    },
    // Beige 38
    {
      id: 'var-b38',
      sku: 'SPF-BEI-38',
      price: 45,
      compareAtPrice: 60,
      color: { id: 'c7', name: 'Beige', hex: '#E8D5B7' },
      size: { id: 's4', name: '38' },
      isActive: true,
      stock: 6,
      isAvailable: true,
    },
    // Beige 39
    {
      id: 'var-b39',
      sku: 'SPF-BEI-39',
      price: 45,
      compareAtPrice: 60,
      color: { id: 'c7', name: 'Beige', hex: '#E8D5B7' },
      size: { id: 's5', name: '39' },
      isActive: true,
      stock: 0,
      isAvailable: false,
    },
  ],
  images: [
    {
      id: 'img-001',
      url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
      altText: 'Sandalia Punta Fina — vista frontal',
      isPrimary: true,
      variantId: null,
      type: 'image',
      sortOrder: 0,
    },
    {
      id: 'img-002',
      url: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80',
      altText: 'Sandalia Punta Fina — vista lateral',
      isPrimary: false,
      variantId: null,
      type: 'image',
      sortOrder: 1,
    },
    {
      id: 'img-003',
      url: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=800&q=80',
      altText: 'Sandalia Punta Fina — detalle suela',
      isPrimary: false,
      variantId: null,
      type: 'image',
      sortOrder: 2,
    },
    {
      id: 'img-004',
      url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80',
      altText: 'Sandalia Punta Fina — vista trasera',
      isPrimary: false,
      variantId: null,
      type: 'image',
      sortOrder: 3,
    },
  ],
}

// ---------------------------------------------------------------------------
// getProductBySlug
// ---------------------------------------------------------------------------

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (!process.env.DATABASE_URL) {
    if (slug === 'sandalia-punta-fina') return DEV_PRODUCT_DETAIL
    // Any other slug without DB → null
    return null
  }

  // Fetch base product
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
      isFeatured: products.isFeatured,
      gender: products.gender,
      tags: products.tags,
      seoTitle: products.seoTitle,
      seoDescription: products.seoDescription,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        eq(products.slug, slug),
        eq(products.isActive, true),
        // Only return published products (publishedAt null = always visible)
        sql`(${products.publishedAt} IS NULL OR ${products.publishedAt} <= NOW())`,
      ),
    )
    .limit(1)

  if (!productRows[0]) return null

  const product = productRows[0]

  // Fetch all variants with color + size + inventory stock
  const variantRows = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      price: productVariants.price,
      compareAtPrice: productVariants.compareAtPrice,
      isActive: productVariants.isActive,
      colorId: colors.id,
      colorName: colors.name,
      colorHex: colors.hex,
      sizeId: sizes.id,
      sizeName: sizes.name,
      inventoryQuantity: inventory.quantity,
      inventoryReserved: inventory.reserved,
    })
    .from(productVariants)
    .innerJoin(colors, eq(colors.id, productVariants.colorId))
    .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(eq(productVariants.productId, product.id))
    .orderBy(asc(sizes.sortOrder))

  // Fetch all images ordered by sortOrder
  const imageRows = await db
    .select({
      id: productMedia.id,
      url: productMedia.url,
      altText: productMedia.altText,
      isPrimary: productMedia.isPrimary,
      variantId: productMedia.variantId,
      type: productMedia.type,
      sortOrder: productMedia.sortOrder,
    })
    .from(productMedia)
    .where(eq(productMedia.productId, product.id))
    .orderBy(desc(productMedia.isPrimary), asc(productMedia.sortOrder))

  const mappedVariants = variantRows.map((v) => {
    const qty = v.inventoryQuantity ?? 0
    const reserved = v.inventoryReserved ?? 0
    const stock = Math.max(0, qty - reserved)
    return {
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice !== null ? Number(v.compareAtPrice) : null,
      color: { id: v.colorId, name: v.colorName, hex: v.colorHex ?? '#888888' },
      size: { id: v.sizeId, name: v.sizeName },
      isActive: v.isActive,
      stock,
      isAvailable: stock > 0 && v.isActive,
    }
  })

  const mappedImages = imageRows.map((img) => ({
    id: img.id,
    url: img.url,
    altText: img.altText,
    isPrimary: img.isPrimary,
    variantId: img.variantId,
    type: img.type as 'image' | 'video',
    sortOrder: img.sortOrder,
  }))

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: Number(product.basePrice),
    compareAtPrice: product.compareAtPrice !== null ? Number(product.compareAtPrice) : null,
    isNew: product.isNew,
    isFeatured: product.isFeatured,
    gender: product.gender,
    category:
      product.categoryId && product.categoryName && product.categorySlug
        ? { id: product.categoryId, name: product.categoryName, slug: product.categorySlug }
        : null,
    tags: product.tags ?? [],
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    variants: mappedVariants,
    images: mappedImages,
  }
}

// ---------------------------------------------------------------------------
// getRelatedProducts
// ---------------------------------------------------------------------------

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<ProductListItem[]> {
  if (!process.env.DATABASE_URL) {
    // Return first N mock products excluding the current one (by id comparison)
    return DEV_PRODUCTS.filter((p) => p.id !== productId).slice(0, limit)
  }

  if (!categoryId) return []

  // Products in the same category, active, with stock, excluding current
  const relatedRows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
      isFeatured: products.isFeatured,
    })
    .from(products)
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
        ne(products.id, productId),
      ),
    )
    .orderBy(desc(products.isFeatured), desc(products.publishedAt))
    .limit(limit)

  if (relatedRows.length === 0) return []

  const relatedIds = relatedRows.map((r) => r.id)

  // Fetch primary images
  const mediaRows = await db
    .select({
      productId: productMedia.productId,
      url: productMedia.url,
      altText: productMedia.altText,
      isPrimary: productMedia.isPrimary,
      sortOrder: productMedia.sortOrder,
    })
    .from(productMedia)
    .where(and(inArray(productMedia.productId, relatedIds), eq(productMedia.type, 'image')))
    .orderBy(desc(productMedia.isPrimary), asc(productMedia.sortOrder))

  // Fetch colors per product
  const colorRows = await db
    .select({
      productId: productVariants.productId,
      colorId: colors.id,
      colorName: colors.name,
      colorHex: colors.hex,
    })
    .from(productVariants)
    .innerJoin(colors, eq(colors.id, productVariants.colorId))
    .where(
      and(
        inArray(productVariants.productId, relatedIds),
        eq(productVariants.isActive, true),
      ),
    )
    .groupBy(productVariants.productId, colors.id, colors.name, colors.hex)

  // Fetch stock status
  const stockRows = await db
    .select({ productId: productVariants.productId })
    .from(productVariants)
    .innerJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(
      and(
        inArray(productVariants.productId, relatedIds),
        eq(productVariants.isActive, true),
        gt(sql`${inventory.quantity} - ${inventory.reserved}`, 0),
      ),
    )
    .groupBy(productVariants.productId)

  const mediaByProduct = new Map<string, { url: string; alt: string }[]>()
  for (const m of mediaRows) {
    const existing = mediaByProduct.get(m.productId) ?? []
    if (existing.length < 2) {
      existing.push({ url: m.url, alt: m.altText ?? '' })
      mediaByProduct.set(m.productId, existing)
    }
  }

  const colorsByProduct = new Map<string, { id: string; name: string; hex: string }[]>()
  for (const c of colorRows) {
    const existing = colorsByProduct.get(c.productId) ?? []
    if (!existing.find((e) => e.id === c.colorId)) {
      existing.push({ id: c.colorId, name: c.colorName, hex: c.colorHex ?? '#888888' })
      colorsByProduct.set(c.productId, existing)
    }
  }

  const hasStockSet = new Set(stockRows.map((s) => s.productId))

  return relatedRows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    basePrice: Number(row.basePrice),
    compareAtPrice: row.compareAtPrice !== null ? Number(row.compareAtPrice) : null,
    isNew: row.isNew,
    isFeatured: row.isFeatured,
    availableColors: colorsByProduct.get(row.id) ?? [],
    images: mediaByProduct.get(row.id) ?? [],
    hasStock: hasStockSet.has(row.id),
  }))
}

// ---------------------------------------------------------------------------
// getRecentlyViewedProducts
// ---------------------------------------------------------------------------

export async function getRecentlyViewedProducts(ids: string[]): Promise<ProductListItem[]> {
  if (ids.length === 0) return []

  const safeIds = ids.slice(0, 8)

  if (!process.env.DATABASE_URL) {
    return DEV_PRODUCTS.filter((p) => safeIds.includes(p.id)).slice(0, 4)
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      isNew: products.isNew,
      isFeatured: products.isFeatured,
    })
    .from(products)
    .where(and(inArray(products.id, safeIds), eq(products.isActive, true)))
    .limit(4)

  if (rows.length === 0) return []

  const productIds = rows.map((r) => r.id)

  const mediaRows = await db
    .select({
      productId: productMedia.productId,
      url: productMedia.url,
      altText: productMedia.altText,
      isPrimary: productMedia.isPrimary,
      sortOrder: productMedia.sortOrder,
    })
    .from(productMedia)
    .where(and(inArray(productMedia.productId, productIds), eq(productMedia.type, 'image')))
    .orderBy(desc(productMedia.isPrimary), asc(productMedia.sortOrder))

  const colorRows = await db
    .select({
      productId: productVariants.productId,
      colorId: colors.id,
      colorName: colors.name,
      colorHex: colors.hex,
    })
    .from(productVariants)
    .innerJoin(colors, eq(colors.id, productVariants.colorId))
    .where(
      and(
        inArray(productVariants.productId, productIds),
        eq(productVariants.isActive, true),
      ),
    )
    .groupBy(productVariants.productId, colors.id, colors.name, colors.hex)

  const mediaByProduct = new Map<string, { url: string; alt: string }[]>()
  for (const m of mediaRows) {
    const existing = mediaByProduct.get(m.productId) ?? []
    if (existing.length < 2) {
      existing.push({ url: m.url, alt: m.altText ?? '' })
      mediaByProduct.set(m.productId, existing)
    }
  }

  const colorsByProduct = new Map<string, { id: string; name: string; hex: string }[]>()
  for (const c of colorRows) {
    const existing = colorsByProduct.get(c.productId) ?? []
    if (!existing.find((e) => e.id === c.colorId)) {
      existing.push({ id: c.colorId, name: c.colorName, hex: c.colorHex ?? '#888888' })
      colorsByProduct.set(c.productId, existing)
    }
  }

  // Preserve order from original ids array
  const rowMap = new Map(rows.map((r) => [r.id, r]))
  return safeIds
    .filter((id) => rowMap.has(id))
    .map((id) => {
      const row = rowMap.get(id)!
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        basePrice: Number(row.basePrice),
        compareAtPrice: row.compareAtPrice !== null ? Number(row.compareAtPrice) : null,
        isNew: row.isNew,
        isFeatured: row.isFeatured,
        availableColors: colorsByProduct.get(row.id) ?? [],
        images: mediaByProduct.get(row.id) ?? [],
        hasStock: true, // recently viewed — don't re-query stock for this lightweight endpoint
      }
    })
}

// ---------------------------------------------------------------------------
// listActiveCategories
// ---------------------------------------------------------------------------

export type CategoryPill = {
  id: string
  name: string
  slug: string
  sortOrder: number
}

export async function listActiveCategories(): Promise<CategoryPill[]> {
  if (!process.env.DATABASE_URL) {
    return [
      { id: 'c1', name: 'Running', slug: 'running', sortOrder: 1 },
      { id: 'c2', name: 'Sneakers', slug: 'sneakers', sortOrder: 2 },
      { id: 'c3', name: 'Casual', slug: 'casual', sortOrder: 3 },
      { id: 'c4', name: 'Sandalias', slug: 'sandalias', sortOrder: 4 },
    ]
  }

  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(and(eq(categories.isActive, true), sql`${categories.parentId} IS NULL`))
      .orderBy(asc(categories.sortOrder), asc(categories.name))
      .limit(12)

    return rows
  } catch (error) {
    console.error('[catalog/repository] listActiveCategories failed:', error)
    return []
  }
}
