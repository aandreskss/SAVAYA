'use client'

import { useState, Suspense } from 'react'
import type { Product } from '@/lib/types'
import FilterSidebar from './FilterSidebar'
import SortSelect from './SortSelect'
import ActiveFilters from './ActiveFilters'
import ProductGrid from '@/components/product/ProductGrid'
import Pagination from './Pagination'

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  )
}

interface CatalogSectionProps {
  products: Product[]
  total: number
  availableSizes: readonly string[]
  availableColors: readonly { readonly name: string; readonly hex: string }[]
  showGenderFilter?: boolean
  disabledCategories?: string[]
}

export default function CatalogSection({
  products,
  total,
  availableSizes,
  availableColors,
  showGenderFilter = false,
  disabledCategories = [],
}: CatalogSectionProps) {
  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* ── Controls bar — sticky below navbar ── */}
      <div className="sticky top-[94px] z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-3 bg-white/95 backdrop-blur-sm border-b border-gray-light flex items-start justify-between gap-4 min-h-[2.5rem]">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <span className="text-sm text-gray-text shrink-0">
            {total} {total === 1 ? 'producto' : 'productos'}
          </span>
          {/* Suspense required because ActiveFilters uses useSearchParams */}
          <Suspense>
            <ActiveFilters />
          </Suspense>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Suspense>
            <SortSelect />
          </Suspense>
          {/* Mobile filter trigger */}
          <button
            onClick={() => setFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 border border-gray-light rounded px-3 py-2 text-sm hover:border-black transition-colors"
          >
            <FilterIcon />
            Filtros
          </button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex gap-8 items-start">
        <Suspense>
          <FilterSidebar
            availableSizes={availableSizes}
            availableColors={availableColors}
            showGenderFilter={showGenderFilter}
            disabledCategories={disabledCategories}
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
          />
        </Suspense>

        <div className="flex-1 min-w-0">
          <ProductGrid products={products} />
          <Suspense>
            <Pagination total={total} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
