import { cn } from '@/shared/lib/utils'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  className?: string
}

function pageRange(current: number, total: number): Array<number | '...'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: Array<number | '...'> = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)
  return pages
}

const btnBase = cn(
  'flex h-9 min-w-[36px] items-center justify-center rounded-sm px-2',
  'font-sans text-sm transition-colors duration-[150ms]',
  'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
  'disabled:opacity-40 disabled:cursor-not-allowed',
)

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = false,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = pageRange(currentPage, totalPages)

  return (
    <nav
      aria-label="Paginación"
      className={cn('flex items-center gap-1', className)}
    >
      {showFirstLast && (
        <button
          type="button"
          aria-label="Primera página"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          className={cn(btnBase, 'text-text-secondary hover:text-text-primary hover:bg-white/8')}
        >
          «
        </button>
      )}

      <button
        type="button"
        aria-label="Página anterior"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={cn(btnBase, 'text-text-secondary hover:text-text-primary hover:bg-white/8')}
      >
        ‹
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span
            key={`ellipsis-${idx}`}
            aria-hidden="true"
            className="flex h-9 min-w-[36px] items-center justify-center font-sans text-sm text-text-secondary"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            aria-label={`Página ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            onClick={() => onPageChange(page)}
            className={cn(
              btnBase,
              page === currentPage
                ? 'bg-accent-gold text-text-primary-inverse'
                : 'text-text-primary hover:bg-white/8',
            )}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Página siguiente"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={cn(btnBase, 'text-text-secondary hover:text-text-primary hover:bg-white/8')}
      >
        ›
      </button>

      {showFirstLast && (
        <button
          type="button"
          aria-label="Última página"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          className={cn(btnBase, 'text-text-secondary hover:text-text-primary hover:bg-white/8')}
        >
          »
        </button>
      )}
    </nav>
  )
}
