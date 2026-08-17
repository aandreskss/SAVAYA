import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getCategoryBySlug,
  getProducts,
  getAvailableFilters,
} from '@/domains/catalog/repository'
import {
  parsePLPSearchParams,
  searchParamsToFilters,
  shouldNoindex,
} from '@/domains/catalog/search-params'
import { ProductCard, Breadcrumb, EmptyState } from '@/shared/ui'
import { FilterSidebar } from '@/domains/catalog/components/FilterSidebar'
import { FilterBottomSheet } from '@/domains/catalog/components/FilterBottomSheet'
import { SortSelect } from '@/domains/catalog/components/SortSelect'
import { ActiveFilterChips } from '@/domains/catalog/components/ActiveFilterChips'
import { PLPPagination } from '@/domains/catalog/components/PLPPagination'

const LIMIT = 24
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const rawParams = await searchParams

  const category = await getCategoryBySlug(slug)
  if (!category) return {}

  const parsedParams = parsePLPSearchParams(rawParams)
  const noindex = shouldNoindex(parsedParams)

  return {
    title: category.seoTitle ?? `${category.name} — SAVAYA`,
    description:
      category.seoDescription ??
      `Descubre nuestra colección de ${category.name.toLowerCase()} venezolano de autor`,
    alternates: {
      canonical: `${BASE_URL}/categoria/${slug}`,
    },
    ...(noindex && { robots: { index: false, follow: true } }),
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const rawParams = await searchParams

  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const parsedParams = parsePLPSearchParams(rawParams)
  const filters = searchParamsToFilters(parsedParams, slug)

  const [{ items, total }, availableFilters] = await Promise.all([
    getProducts({ ...filters, limit: LIMIT }),
    getAvailableFilters(slug),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  // Build lookup maps for chip labels
  const colorNames: Record<string, string> = {}
  for (const c of availableFilters.colors) {
    colorNames[c.id] = c.name
  }
  const sizeNames: Record<string, string> = {}
  for (const s of availableFilters.sizes) {
    sizeNames[s.id] = s.name
  }

  // BreadcrumbList structured data
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: category.name },
    ],
  }

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-screen-xl mx-auto px-4 md:px-10 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: category.name },
          ]}
        />

        {/* Category header */}
        <div className="mt-6 mb-8">
          <h1 className="font-display font-black text-[34px] md:text-[38px] uppercase tracking-tight text-text-primary">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-text-secondary mt-2 max-w-2xl">{category.description}</p>
          )}
          <p className="text-sm text-text-secondary mt-1">{total} productos</p>
        </div>

        <div className="flex gap-8">
          {/* Filter sidebar — desktop only */}
          <aside className="hidden md:block w-56 flex-shrink-0" aria-label="Filtros de productos">
            <FilterSidebar
              availableColors={availableFilters.colors}
              availableSizes={availableFilters.sizes}
              priceRange={availableFilters.priceRange}
              activeFilters={parsedParams}
            />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Top bar: active chips + sort */}
            <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
              <ActiveFilterChips
                activeFilters={parsedParams}
                colorNames={colorNames}
                sizeNames={sizeNames}
              />
              <div className="ml-auto shrink-0">
                <SortSelect currentSort={parsedParams.orden} />
              </div>
            </div>

            {/* Product grid */}
            {items.length === 0 ? (
              <EmptyState
                title="Sin resultados"
                description="Prueba con otros filtros o explora toda nuestra colección"
              />
            ) : (
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                aria-label={`Productos de ${category.name}`}
              >
                {items.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    basePrice={product.basePrice}
                    compareAtPrice={product.compareAtPrice}
                    images={product.images}
                    availableColors={product.availableColors}
                    badges={
                      product.isNew
                        ? ['new']
                        : product.compareAtPrice
                          ? ['sale']
                          : undefined
                    }
                    priority={index < 4}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <PLPPagination
                  currentPage={parsedParams.pagina}
                  totalPages={totalPages}
                  activeFilters={parsedParams}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile filter bottom sheet */}
        <FilterBottomSheet
          availableColors={availableFilters.colors}
          availableSizes={availableFilters.sizes}
          priceRange={availableFilters.priceRange}
          activeFilters={parsedParams}
          totalResults={total}
        />
      </div>
    </>
  )
}
