import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
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
    title: 'Calzado Mujer — SAVAYA',
    description:
      'Toda la colección de calzado femenino SAVAYA: sandalias, tacones, plataformas y más',
    alternates: {
      canonical: 'https://www.savayavzla.com/mujer',
    },
    ...(noindex && { robots: { index: false, follow: true } }),
  }
}

export default async function MujerPage({ searchParams }: Props) {
  const rawParams = await searchParams
  const parsedParams = parsePLPSearchParams(rawParams)

  const filters = {
    ...searchParamsToFilters(parsedParams),
    gender: 'women' as const,
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
    <div className="max-w-screen-xl mx-auto px-4 md:px-10">
      {/* Breadcrumb */}
      <div className="py-4">
        <Breadcrumb
          items={[{ label: 'Inicio', href: '/' }, { label: 'Mujer' }]}
        />
      </div>

      {/* Hero Banner Femenino */}
      <div className="relative w-full h-[340px] md:h-[460px] overflow-hidden rounded-2xl mb-10">
        <Image
          src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1600&q=80"
          alt="Colección Femenina SAVAYA"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay — rosa cálido a izquierda, oscuro abajo */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(80,30,30,0.72) 0%, rgba(0,0,0,0.18) 60%), linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)',
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-7 md:p-12">
          <span className="text-white/70 text-[11px] font-semibold uppercase tracking-[0.25em] mb-3">
            Colección SAVAYA
          </span>
          <h1 className="font-display font-black text-[52px] md:text-[80px] uppercase text-white leading-none tracking-tight mb-4">
            Para<br />Ella
          </h1>
          <p className="text-white/75 text-sm mb-7 max-w-xs">
            Sandalias · Tacones · Plataformas · Flats · Botas
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/mujer/categoria/sandalias"
              className="inline-flex items-center bg-white text-[#2a1a1a] text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
            >
              Ver Sandalias
            </Link>
            <Link
              href="/mujer/categoria/tacones"
              className="inline-flex items-center border border-white/60 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
            >
              Tacones
            </Link>
          </div>
        </div>

        {/* Decorative side label */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3">
          <div className="w-px h-16 bg-white/30" />
          <span
            className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ writingMode: 'vertical-rl' }}
          >
            Calzado Femenino
          </span>
          <div className="w-px h-16 bg-white/30" />
        </div>
      </div>

      {/* Count + Filters + Grid */}
      <div className="mb-6">
        <p className="text-sm text-text-secondary">{total} productos</p>
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
              aria-label="Productos femeninos SAVAYA"
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
  )
}
