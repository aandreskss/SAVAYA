'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Pagination } from '@/shared/ui'
import type { PLPSearchParams } from '../search-params'
import { buildFilterUrl } from '../search-params'

type PLPPaginationProps = {
  currentPage: number
  totalPages: number
  activeFilters: PLPSearchParams
}

export function PLPPagination({
  currentPage,
  totalPages,
  activeFilters,
}: PLPPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()

  function handlePageChange(page: number) {
    const qs = buildFilterUrl(activeFilters, { pagina: page })
    router.push(`${pathname}${qs}`)
    // Scroll to top after navigation
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (totalPages <= 1) return null

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  )
}
