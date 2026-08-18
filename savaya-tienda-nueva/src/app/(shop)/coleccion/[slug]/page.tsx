import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getCollectionBySlug,
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

  const collection = await getCollectionBySlug(slug)
  if (!collection) return {}

  const parsedParams = parsePLPSearchParams(rawParams)
  const noindex = shouldNoindex(parsedParams)

  return {
    title: `${collection.name} — SAVAYA`,
    description:
      collection.description ??
      `Descubre los productos de la colección ${collection.name} de SAVAYA`,
    alternates: {
      canonical: `${BASE_URL}/coleccion/${slug}`,
    },
    ...(noindex && { robots: { index: false, follow: true } }),
  }
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params
  const rawParams = await searchParams

  const collection = await getCollectionBySlug(slug)
  if (!collection) notFound()

  const parsedParams = parsePLPSearchParams(rawParams)

  const filters = {
    ...searchParamsToFilters(parsedParams),
    collectionSlug: slug,
  }

  const [{ items, total }, availableFilters] = await Promise.all([
    getProducts({ ...filters, limit: LIMIT }),
    getAvailableFilters(),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  const colorNames: Record<string, string> = {}
  for (const c of availableFilters.colors) {
    colorNames[c.id] = c.name
  }
  const sizeNames: Record<string, string> = {}
  for (const s of availableFilters.sizes) {
    sizeNames[s.id] = s.name
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: collection.name },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-screen-xl mx-auto px-4 md:px-10 py-8">
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: collection.name },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="font-display font-black text-[34px] md:text-[38px] uppercase tracking-tight text-text-primary">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-text-secondary mt-2 max-w-2xl">{collection.description}</p>
          )}
          <p className="text-sm text-text-secondary mt-1">{total} productos</p>
        </div>

        <div className="flex gap-8">
          <aside className="hidden md:block w-56 flex-shrink-0" aria-label="Filtros de productos">
            <FilterSidebar
              availableColors={availableFilters.colors}
              availableSizes={availableFilters.sizes}
              priceRange={availableFilters.priceRange}
              activeFilters={parsedParams}
            />
          </aside>

          <div className="flex-1 min-w-0">
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

            {items.length === 0 ? (
              <EmptyState
                title="Sin resultados"
                description="Prueba con otros filtros o explora toda nuestra colección"
              />
            ) : (
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                aria-label={`Productos de ${collection.name}`}
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
