import Link from 'next/link'
import type { Metadata } from 'next'
import type { Product, ProductColorImages } from '@/lib/types'
import { parseSearchParams, fetchCatalogProducts, getDisabledCategories, getSizesFromProducts, getColorsFromProducts, CATALOG_PRICE_MAX, type ParsedFilters } from '@/lib/catalog'
import CatalogSection from '@/components/catalog/CatalogSection'
import ProductGrid from '@/components/product/ProductGrid'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchSearchProducts(
  q: string,
  filters: ParsedFilters,
): Promise<{ products: Product[]; total: number }> {
  const lower = q.toLowerCase()

  async function fromMock() {
    const { FEATURED_PRODUCTS, NEW_ARRIVALS, SALE_PRODUCTS } = await import('@/lib/mock-data')
    let products: Product[] = [...FEATURED_PRODUCTS, ...NEW_ARRIVALS, ...SALE_PRODUCTS]
      .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.description ?? '').toLowerCase().includes(lower),
      )

    if (filters.soloDescuento) products = products.filter((p) => p.sale_price != null)
    if (filters.generos.length > 0) products = products.filter((p) => filters.generos.includes(p.gender))
    if (filters.precioMin > 0 || filters.precioMax < CATALOG_PRICE_MAX) {
      products = products.filter((p) => {
        const price = p.sale_price ?? p.base_price
        return price >= filters.precioMin && price <= filters.precioMax
      })
    }
    if (filters.tallas.length > 0) {
      products = products.filter(
        (p) =>
          !p.variants?.length ||
          p.variants.some((v) => filters.tallas.includes(v.size) && v.stock > 0),
      )
    }
    if (filters.colores.length > 0) {
      const lowerColors = filters.colores.map((c) => c.toLowerCase())
      products = products.filter(
        (p) =>
          !p.variants?.length ||
          p.variants.some((v) => lowerColors.includes(v.color.toLowerCase()) && v.stock > 0),
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        products.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      default:
        products.sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    }

    return { products, total: products.length }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return fromMock()

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    let query = supabase
      .from('products')
      .select('*, variants:product_variants(id, size, color, color_hex, stock, sku, product_id)')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .gte('base_price', filters.precioMin)
      .lte('base_price', filters.precioMax)

    if (filters.soloDescuento) query = query.not('sale_price', 'is', null)
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

    const { data, error } = await query
    if (error) throw error

    let products = (data ?? []) as Product[]

    if (filters.tallas.length > 0) {
      products = products.filter((p) =>
        p.variants?.some((v) => filters.tallas.includes(v.size) && v.stock > 0),
      )
    }
    if (filters.colores.length > 0) {
      const lowerColors = filters.colores.map((c) => c.toLowerCase())
      products = products.filter((p) =>
        p.variants?.some((v) => lowerColors.includes(v.color.toLowerCase()) && v.stock > 0),
      )
    }

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

    return { products, total: products.length }
  } catch {
    return fromMock()
  }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const q = String(params.q ?? '').trim()
  return {
    title: q ? `Resultados para "${q}" | Savaya` : 'Buscar | Savaya',
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const SUGGESTED_CATEGORIES = [
  { label: 'Mujer', href: '/mujer' },
  { label: 'De vestir', href: '/de-vestir' },
  { label: 'Más vendidos', href: '/mas-vendidos' },
  { label: 'Zapatos', href: '/zapatos' },
  { label: 'Accesorios', href: '/accesorios' },
  { label: 'Nuevas Colecciones', href: '/nuevas-colecciones' },
]

export default async function BuscarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const q = String(params.q ?? '').trim()
  const filters = parseSearchParams(params)
  const hasQuery = q.length >= 2

  const [searchResult, disabledCategories] = await Promise.all([
    hasQuery ? fetchSearchProducts(q, filters) : Promise.resolve({ products: [] as Product[], total: 0 }),
    getDisabledCategories(),
  ])
  const { products, total } = searchResult

  const suggestions =
    !hasQuery || total === 0
      ? await fetchCatalogProducts({ fixedIsNew: true }, parseSearchParams({}))
      : { products: [] as Product[], total: 0 }

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-14">

        {/* ── Heading ── */}
        <div className="mb-8">
          {hasQuery ? (
            total > 0 ? (
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                {total} resultado{total !== 1 ? 's' : ''} para{' '}
                &ldquo;<span className="italic font-normal">{q}</span>&rdquo;
              </h1>
            ) : (
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                No encontramos resultados para{' '}
                &ldquo;<span className="italic font-normal">{q}</span>&rdquo;
              </h1>
            )
          ) : (
            <h1 className="font-display text-2xl md:text-3xl font-bold">Buscar</h1>
          )}
        </div>

        {/* ── Results grid ── */}
        {hasQuery && total > 0 && (
          <CatalogSection
            products={products}
            total={total}
            availableSizes={getSizesFromProducts(products)}
            availableColors={getColorsFromProducts(products)}
            showGenderFilter
            disabledCategories={disabledCategories}
          />
        )}

        {/* ── No-results tips ── */}
        {hasQuery && total === 0 && (
          <div className="text-center py-6 mb-10">
            <p className="text-gray-text text-sm mb-6">
              Intenta con otras palabras o explora estas categorías:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_CATEGORIES.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm border border-gray-light rounded-full px-4 py-2 hover:border-black transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty query prompt ── */}
        {!hasQuery && (
          <p className="text-gray-text text-center py-16">
            Escribe al menos 2 caracteres para comenzar la búsqueda.
          </p>
        )}

        {/* ── Suggestions ── */}
        {(!hasQuery || total === 0) && suggestions.products.length > 0 && (
          <section className={hasQuery && total === 0 ? '' : 'mt-4'}>
            <h2 className="font-display text-xl font-bold mb-6">
              {hasQuery && total === 0 ? 'También te puede gustar' : 'Nuevas colecciones'}
            </h2>
            <ProductGrid products={suggestions.products.slice(0, 8)} />
          </section>
        )}

      </div>
    </main>
  )
}
