'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PAGE_SIZE } from '@/lib/constants'

interface PaginationProps {
  total: number
}

export default function Pagination({ total }: PaginationProps) {
  const searchParams = useSearchParams()
  const currentPage = Math.max(1, parseInt(searchParams.get('pagina') ?? '1') || 1)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (totalPages <= 1) return null

  function buildUrl(page: number): string {
    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete('pagina')
    } else {
      params.set('pagina', String(page))
    }
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  const delta = 2
  const rangeStart = Math.max(1, currentPage - delta)
  const rangeEnd = Math.min(totalPages, currentPage + delta)
  const pages: number[] = []
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)

  const linkBase =
    'flex items-center justify-center min-w-[36px] h-9 px-3 text-sm border rounded transition-colors'
  const linkActive = 'border-black bg-black text-white'
  const linkDefault = 'border-gray-light hover:border-black'
  const linkDisabled = 'border-gray-light opacity-40 pointer-events-none'

  return (
    <nav
      className="flex items-center justify-center flex-wrap gap-1 mt-10 mb-2"
      aria-label="Paginación"
    >
      <Link
        href={buildUrl(currentPage - 1)}
        aria-disabled={currentPage === 1}
        className={`${linkBase} ${currentPage === 1 ? linkDisabled : linkDefault}`}
      >
        ←
      </Link>

      {rangeStart > 1 && (
        <>
          <Link href={buildUrl(1)} className={`${linkBase} ${linkDefault}`}>1</Link>
          {rangeStart > 2 && <span className="px-1 text-gray-text text-sm">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={buildUrl(p)}
          className={`${linkBase} ${p === currentPage ? linkActive : linkDefault}`}
          aria-current={p === currentPage ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}

      {rangeEnd < totalPages && (
        <>
          {rangeEnd < totalPages - 1 && <span className="px-1 text-gray-text text-sm">…</span>}
          <Link href={buildUrl(totalPages)} className={`${linkBase} ${linkDefault}`}>
            {totalPages}
          </Link>
        </>
      )}

      <Link
        href={buildUrl(currentPage + 1)}
        aria-disabled={currentPage === totalPages}
        className={`${linkBase} ${currentPage === totalPages ? linkDisabled : linkDefault}`}
      >
        →
      </Link>
    </nav>
  )
}
