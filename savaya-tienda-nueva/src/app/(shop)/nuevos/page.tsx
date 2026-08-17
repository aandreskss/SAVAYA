import type { Metadata } from 'next'
import { getProducts, getAvailableFilters } from '@/domains/catalog/repository'
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

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const rawParams = await searchParams
  const parsedParams = parsePLPSearchParams(rawParams)
  const noindex = shouldNoindex(parsedParams)

  return {
    title: 'Nuevos — SAVAYA',
    description: 'Descubre los últimos lanzamientos de SAVAYA, calzado de autor venezolano',
    alternates: {
      canonical: 'https://www.savayavzla.com/nuevos',
    },
    ...(noindex && { robots: { index: false, follow: true } }),
  }
}

export default async function NuevosPage({ searchParams }: Props) {
  const rawParams = await searchParams
  const parsedParams = parsePLPSearchParams(rawParams)

  // Force onlyNew — merge with user filters
  const filters = {
    ...searchParamsToFilters(parsedParams),
    onlyNew: true,
    limit: LIMIT,
  }

  const [{ items, total }, availableFilters] = await Promise.all([
    getProducts(filters),
    getAvailableFilters(),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  const colorNames: Record<string, string> = {}
  for (const c of availableFilters.colors) colorNames[c.id] = c.name

  const sizeNames: Record<string, string> = {}
  for (const s of availableFilters.sizes) sizeNames[s.id] = s.name

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <Breadcrumb
        items={[{ label: 'Inicio', href: '/' }, { label: 'Nuevos' }]}
      />

      <div className="mt-6 mb-8">
        <h1 className="font-display text-4xl font-bold text-text-primary">Nuevos</h1>
        <p className="text-text-secondary mt-2">
          Los últimos lanzamientos de la colección SAVAYA
        </p>
        <p className="text-sm text-text-secondary mt-1">{total} productos</p>
      </div>

      <div className="flex gap-8">
        <aside className="hidden md:block w-56 flex-shrink-0">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
                  badges={['new']}
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
  )
}
