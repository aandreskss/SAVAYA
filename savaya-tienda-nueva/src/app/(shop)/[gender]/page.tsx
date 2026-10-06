import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getProducts,
  getAvailableFilters,
  getCategoryIdsByGender,
} from '@/domains/catalog/repository'
import { getGenderHeroSection } from '@/domains/cms/repository'
import { getGenderBySlug } from '@/domains/admin/cms/repository'
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
import Image from 'next/image'
import Link from 'next/link'

const LIMIT = 24
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.savayavzla.com'

type Props = {
  params: Promise<{ gender: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { gender } = await params
  const rawParams = await searchParams

  const genderData = await getGenderBySlug(gender)
  if (!genderData) return {}

  const parsedParams = parsePLPSearchParams(rawParams)
  const noindex = shouldNoindex(parsedParams)

  return {
    title: `Calzado ${genderData.label} — SAVAYA`,
    description: `Toda la colección de calzado ${genderData.label.toLowerCase()} SAVAYA`,
    alternates: { canonical: `${BASE_URL}/${gender}` },
    ...(noindex && { robots: { index: false, follow: true } }),
  }
}

export default async function DynamicGenderPage({ params, searchParams }: Props) {
  const { gender } = await params
  const rawParams = await searchParams

  const genderData = await getGenderBySlug(gender)
  if (!genderData) notFound()

  const parsedParams = parsePLPSearchParams(rawParams)

  const categoryIds = await getCategoryIdsByGender(gender)

  const filters = {
    ...searchParamsToFilters(parsedParams),
    ...(categoryIds.length > 0 ? { categoryIds } : {}),
    limit: LIMIT,
  }

  const [{ items, total }, availableFilters, hero] = await Promise.all([
    getProducts(filters),
    getAvailableFilters(),
    getGenderHeroSection(gender),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  const colorNames: Record<string, string> = {}
  for (const c of availableFilters.colors) colorNames[c.id] = c.name

  const sizeNames: Record<string, string> = {}
  for (const s of availableFilters.sizes) sizeNames[s.id] = s.name

  const heroImage = hero?.imageDesktopUrl ?? null
  const heroOverlay = hero?.overlayOpacity ?? 0.65
  const heroTagline = hero?.tagline ?? null
  const cta1Text = hero?.ctaPrimaryText ?? null
  const cta1Href = hero?.ctaPrimaryHref ?? null
  const cta2Text = hero?.ctaSecondaryText ?? null
  const cta2Href = hero?.ctaSecondaryHref ?? null

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-10">
      <div className="py-4">
        <Breadcrumb
          items={[{ label: 'Inicio', href: '/' }, { label: genderData.label }]}
        />
      </div>

      {heroImage ? (
        <div className="relative w-full h-[340px] md:h-[460px] overflow-hidden rounded-2xl mb-10">
          <Image
            src={heroImage}
            alt={`Colección ${genderData.label} SAVAYA`}
            fill
            className="object-cover object-center"
            priority
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, rgba(80,30,30,${heroOverlay}) 0%, rgba(0,0,0,${(heroOverlay * 0.25).toFixed(2)}) 60%), linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)`,
            }}
          />
          <div className="absolute inset-0 flex flex-col justify-end p-7 md:p-12">
            <span className="text-white/70 text-[11px] font-semibold uppercase tracking-[0.25em] mb-3">
              Colección SAVAYA
            </span>
            <h1 className="font-display font-black text-[52px] md:text-[80px] uppercase text-white leading-none tracking-tight mb-4">
              {genderData.label}
            </h1>
            {heroTagline && (
              <p className="text-white/75 text-sm mb-7 max-w-xs">{heroTagline}</p>
            )}
            {cta1Text && cta1Href && (
              <div className="flex gap-3 flex-wrap">
                <Link
                  href={cta1Href}
                  className="inline-flex items-center bg-white text-[#2a1a1a] text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
                >
                  {cta1Text}
                </Link>
                {cta2Text && cta2Href && (
                  <Link
                    href={cta2Href}
                    className="inline-flex items-center border border-white/60 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
                  >
                    {cta2Text}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-10 py-10 border-b border-border">
          <h1 className="font-display font-black text-[52px] md:text-[80px] uppercase leading-none tracking-tight text-text-primary">
            {genderData.label}
          </h1>
          <p className="text-text-secondary mt-3 text-sm">Colección SAVAYA</p>
        </div>
      )}

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
              className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-7"
              aria-label={`Productos ${genderData.label} SAVAYA`}
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
                  isVip={product.isVip}
                  badges={
                    !product.isVip && product.isNew
                      ? ['new']
                      : !product.isVip && product.compareAtPrice
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
