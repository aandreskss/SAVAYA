import type { Product, Gender, ProductType, SortOption, ProductColorImages } from './types'
import { PAGE_SIZE } from './constants'

export { PAGE_SIZE }
export const CATALOG_PRICE_MAX = 500_000

// ─── Shared helper ────────────────────────────────────────────────────────────

export async function getDisabledCategories(): Promise<string[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  try {
    const { createAdminClient } = await import('./supabase/server')
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('category_visibility')
      .select('key, is_visible')
    return (data ?? []).filter((r) => !r.is_visible).map((r) => r.key)
  } catch {
    return []
  }
}

// ─── Dynamic sizes from product variants ─────────────────────────────────────

const CLOTHING_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL']

export function getSizesFromProducts(products: Product[]): string[] {
  const sizeSet = new Set<string>()
  for (const p of products) {
    for (const v of p.variants ?? []) {
      if (v.stock > 0 && v.size) sizeSet.add(v.size)
    }
  }
  return [...sizeSet].sort((a, b) => {
    const aIdx = CLOTHING_SIZE_ORDER.indexOf(a.toUpperCase())
    const bIdx = CLOTHING_SIZE_ORDER.indexOf(b.toUpperCase())
    const aNum = parseFloat(a)
    const bNum = parseFloat(b)
    const aIsNum = !isNaN(aNum)
    const bIsNum = !isNaN(bNum)
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
    if (aIsNum && bIsNum) return aNum - bNum
    if (aIdx !== -1) return -1
    if (bIdx !== -1) return 1
    return a.localeCompare(b)
  })
}

export function getColorsFromProducts(products: Product[]): { name: string; hex: string }[] {
  const colorMap = new Map<string, string>() // name → hex
  for (const p of products) {
    for (const v of p.variants ?? []) {
      if (v.stock > 0 && v.color && v.color_hex && !colorMap.has(v.color)) {
        colorMap.set(v.color, v.color_hex)
      }
    }
  }
  return [...colorMap.entries()]
    .map(([name, hex]) => ({ name, hex }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

// ─── Config & filter types ────────────────────────────────────────────────────

/** Page-level fixed constraints (not user-adjustable). */
export interface CatalogConfig {
  /** Restrict to these genders (e.g. ['women'] for /mujer). Omit for all genders. */
  fixedGender?: Gender[]
  /** Restrict to these product types (e.g. ['shoes'] for /zapatos). */
  fixedType?: ProductType[]
  /** Only return is_new = true products. */
  fixedIsNew?: boolean
  /** Only return products with sale_price (for /descuentos). */
  fixedOnSale?: boolean
  /** Remates logic: discount >= 40% OR tags contains 'remate'. */
  isRemates?: boolean
  /** Restrict to products belonging to a specific brand (by slug). */
  fixedBrandSlug?: string
  /** Only return is_featured = true products (for /mas-vendidos). */
  fixedIsFeatured?: boolean
}

/** Parsed URL search params — all user-adjustable filters. */
export interface ParsedFilters {
  sort: SortOption
  tallas: string[]
  colores: string[]
  /** User-selectable gender filter (only shown on /zapatos and /accesorios). */
  generos: Gender[]
  precioMin: number
  precioMax: number
  soloDescuento: boolean
  /** Subcategory slug from ?cat= param. */
  categorySlug?: string
  /** Current page number (1-based), parsed from ?pagina= param. */
  page: number
}

// ─── Parse search params ──────────────────────────────────────────────────────

export function parseSearchParams(
  params: Record<string, string | string[] | undefined>,
  defaultSort: SortOption = 'featured',
): ParsedFilters {
  return {
    sort: (String(params.sort ?? defaultSort)) as SortOption,
    tallas: params.tallas ? String(params.tallas).split(',').filter(Boolean) : [],
    colores: params.colores ? String(params.colores).split(',').filter(Boolean) : [],
    generos: params.generos
      ? (String(params.generos).split(',').filter(Boolean) as Gender[])
      : [],
    precioMin: params.precio_min ? Math.max(0, Number(params.precio_min)) : 0,
    precioMax: params.precio_max
      ? Math.min(CATALOG_PRICE_MAX, Number(params.precio_max))
      : CATALOG_PRICE_MAX,
    soloDescuento: params.descuento === 'true',
    categorySlug: params.cat ? String(params.cat).trim() || undefined : undefined,
    page: Math.max(1, parseInt(String(params.pagina ?? '1')) || 1),
  }
}

// ─── Fetch products ───────────────────────────────────────────────────────────

export async function fetchCatalogProducts(
  config: CatalogConfig,
  filters: ParsedFilters,
): Promise<{ products: Product[]; total: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return getMockData(config, filters)
  }

  try {
    const { createAdminClient } = await import('./supabase/server')
    const supabase = await createAdminClient()

    // Resolve category slug to id (for ?cat= subcategory filter)
    let categoryId: string | undefined
    if (filters.categorySlug) {
      const { data: catRow } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', filters.categorySlug)
        .single()
      categoryId = (catRow as { id: string } | null)?.id
    }

    // Resolve brand slug to id (for /marcas/[slug] pages)
    let brandId: string | undefined
    if (config.fixedBrandSlug) {
      const { data: brandRow } = await supabase
        .from('brands')
        .select('id')
        .eq('slug', config.fixedBrandSlug)
        .eq('is_active', true)
        .single()
      brandId = (brandRow as { id: string } | null)?.id
      if (!brandId) return { products: [], total: 0 }
    }

    // Pagination applies at DB level only when no in-app variant filtering is needed
    const hasVariantFilters = filters.tallas.length > 0 || filters.colores.length > 0
    const useDbPagination = !hasVariantFilters && !config.isRemates

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .gte('base_price', filters.precioMin)
      .lte('base_price', filters.precioMax)

    if (categoryId) query = query.eq('category_id', categoryId)
    if (brandId)    query = query.eq('brand_id', brandId)

    if (config.fixedGender?.length)  query = query.in('gender', config.fixedGender)
    if (config.fixedType?.length)    query = query.in('type', config.fixedType)
    if (config.fixedIsNew)           query = query.eq('is_new', true)
    if (config.fixedIsFeatured)      query = query.eq('is_featured', true)

    // All three sale-related flags require sale_price to be set
    if (config.fixedOnSale || config.isRemates || filters.soloDescuento) {
      query = query.not('sale_price', 'is', null)
    }

    // User-selected genders (for /zapatos, /accesorios)
    if (filters.generos.length > 0) query = query.in('gender', filters.generos)

    switch (filters.sort) {
      case 'price_asc':
        query = query.order('base_price', { ascending: true })
        break
      case 'price_desc':
        query = query.order('base_price', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
    }

    if (useDbPagination) {
      const offset = (filters.page - 1) * PAGE_SIZE
      query = query.range(offset, offset + PAGE_SIZE - 1)
    }

    const { data, count, error } = await query
    if (error) throw error

    let products = (data ?? []) as Product[]

    // Remates: >= 40% discount OR tagged 'remate'
    if (config.isRemates) {
      products = products.filter(
        (p) =>
          p.tags?.includes('remate') ||
          (p.sale_price != null && (p.base_price - p.sale_price) / p.base_price >= 0.4),
      )
    }

    // Fetch variants separately (avoids relying on FK relationship in PostgREST)
    if (products.length > 0) {
      const { data: variantRows } = await supabase
        .from('product_variants')
        .select('id, size, color, color_hex, stock, sku, product_id')
        .in('product_id', products.map((p) => p.id))
      const byProduct = new Map<string, Product['variants']>()
      ;(variantRows ?? []).forEach((v: { product_id: string }) => {
        if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, [])
        byProduct.get(v.product_id)!.push(v as never)
      })
      products = products.map((p) => ({ ...p, variants: byProduct.get(p.id) ?? [] }))
    }

    // Fetch color images separately
    if (products.length > 0) {
      const { data: colorRows } = await supabase
        .from('product_color_images')
        .select('*')
        .in('product_id', products.map((p) => p.id))
      const byProductColor = new Map<string, ProductColorImages[]>()
      ;(colorRows ?? []).forEach((ci: ProductColorImages) => {
        if (!byProductColor.has(ci.product_id)) byProductColor.set(ci.product_id, [])
        byProductColor.get(ci.product_id)!.push(ci)
      })
      products = products.map((p) => ({ ...p, color_images: byProductColor.get(p.id) ?? [] }))
    }

    // Variant-based filters (app layer — only active when useDbPagination = false)
    if (filters.tallas.length > 0) {
      products = products.filter((p) =>
        p.variants?.some((v) => filters.tallas.includes(v.size) && v.stock > 0),
      )
    }
    if (filters.colores.length > 0) {
      const lower = filters.colores.map((c) => c.toLowerCase())
      products = products.filter((p) =>
        p.variants?.some((v) => lower.includes(v.color.toLowerCase()) && v.stock > 0),
      )
    }

    const total = useDbPagination ? (count ?? products.length) : products.length
    return { products, total }
  } catch {
    return getMockData(config, filters)
  }
}

// ─── Mock data fallback ───────────────────────────────────────────────────────

async function getMockData(
  config: CatalogConfig,
  filters: ParsedFilters,
): Promise<{ products: Product[]; total: number }> {
  const { FEATURED_PRODUCTS, NEW_ARRIVALS, SALE_PRODUCTS } = await import('./mock-data')

  // Deduplicated pool of all mock products
  let products: Product[] = [...FEATURED_PRODUCTS, ...NEW_ARRIVALS, ...SALE_PRODUCTS].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
  )

  // Fixed config filters
  if (config.fixedGender?.length)
    products = products.filter((p) => config.fixedGender!.includes(p.gender))

  if (config.fixedType?.length)
    products = products.filter((p) => config.fixedType!.includes(p.type))

  if (config.fixedIsNew)
    products = products.filter((p) => p.is_new)

  if (config.fixedIsFeatured)
    products = products.filter((p) => p.is_featured)

  if (config.fixedOnSale)
    products = products.filter((p) => p.sale_price != null)

  if (config.isRemates) {
    const strict = products.filter(
      (p) =>
        p.tags?.includes('remate') ||
        (p.sale_price != null && (p.base_price - p.sale_price) / p.base_price >= 0.3),
    )
    // Mock data has modest discounts — fall back to any discounted product
    products = strict.length > 0 ? strict : products.filter((p) => p.sale_price != null)
  }

  // User filters
  if (filters.generos.length > 0)
    products = products.filter((p) => filters.generos.includes(p.gender))

  if (filters.soloDescuento)
    products = products.filter((p) => p.sale_price != null)

  if (filters.precioMin > 0 || filters.precioMax < CATALOG_PRICE_MAX) {
    products = products.filter((p) => {
      const price = p.sale_price ?? p.base_price
      return price >= filters.precioMin && price <= filters.precioMax
    })
  }

  // Variant filters — with mock products having no variants, allow through when variants=[]]
  if (filters.tallas.length > 0) {
    products = products.filter(
      (p) =>
        !p.variants?.length ||
        p.variants.some((v) => filters.tallas.includes(v.size) && v.stock > 0),
    )
  }
  if (filters.colores.length > 0) {
    const lower = filters.colores.map((c) => c.toLowerCase())
    products = products.filter(
      (p) =>
        !p.variants?.length ||
        p.variants.some((v) => lower.includes(v.color.toLowerCase()) && v.stock > 0),
    )
  }

  switch (filters.sort) {
    case 'price_asc':
      products.sort((a, b) => (a.sale_price ?? a.base_price) - (b.sale_price ?? b.base_price))
      break
    case 'price_desc':
      products.sort((a, b) => (b.sale_price ?? b.base_price) - (a.sale_price ?? a.base_price))
      break
    case 'newest':
      products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      break
    default:
      products.sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
  }

  return { products, total: products.length }
}
