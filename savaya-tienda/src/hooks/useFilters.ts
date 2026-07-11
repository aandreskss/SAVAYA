'use client'

import { useState, useCallback } from 'react'
import type { FilterState } from '@/lib/types'

const defaultFilters: FilterState = {
  gender: [],
  type: [],
  sizes: [],
  colors: [],
  minPrice: null,
  maxPrice: null,
  isNew: false,
  onSale: false,
  sortBy: 'newest',
}

export function useFilters(initial?: Partial<FilterState>) {
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters, ...initial })

  const update = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setFilters({ ...defaultFilters, ...initial }), [initial])

  const hasActiveFilters =
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.isNew ||
    filters.onSale

  return { filters, update, reset, hasActiveFilters }
}
