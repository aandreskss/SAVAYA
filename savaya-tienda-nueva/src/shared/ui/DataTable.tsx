'use client'

import type { ReactNode } from 'react'
import { Skeleton } from './Skeleton'
import { EmptyState } from './EmptyState'
import { cn } from '@/shared/lib/utils'

export type Column<T> = {
  key: keyof T | string
  header: string
  cell?: (row: T) => ReactNode
  sortable?: boolean
  width?: string
}

export type DataTableProps<T> = {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  emptyMessage?: string
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  currentSort?: { key: string; direction: 'asc' | 'desc' }
  className?: string
}

function SortIcon({ direction }: { direction?: 'asc' | 'desc' | null }) {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path
        d="M7 3v8M4 6l3-3 3 3"
        stroke={direction === 'asc' ? 'currentColor' : 'currentColor'}
        strokeOpacity={direction === 'asc' ? 1 : 0.3}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 8l3 3 3-3"
        stroke={direction === 'desc' ? 'currentColor' : 'currentColor'}
        strokeOpacity={direction === 'desc' ? 1 : 0.3}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="4" y="12" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M4 18h32" stroke="currentColor" strokeWidth="2" />
      <path d="M14 18V8M26 18V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const SKELETON_ROWS = 5

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
  onSort,
  currentSort,
  className,
}: DataTableProps<T>) {
  const handleSortClick = (col: Column<T>) => {
    if (!col.sortable || !onSort) return
    const colKey = String(col.key)
    const nextDirection =
      currentSort?.key === colKey && currentSort.direction === 'asc' ? 'desc' : 'asc'
    onSort(colKey, nextDirection)
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-lg border border-border', className)}>
      <table className="w-full min-w-full text-sm" role="grid">
        <thead className="bg-surface-2 border-b border-border">
          <tr>
            {columns.map((col) => {
              const colKey = String(col.key)
              const isSorted = currentSort?.key === colKey
              const ariaSort = !col.sortable
                ? undefined
                : isSorted
                ? currentSort?.direction === 'asc'
                  ? ('ascending' as const)
                  : ('descending' as const)
                : ('none' as const)

              return (
                <th
                  key={colKey}
                  scope="col"
                  aria-sort={ariaSort}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-text-primary transition-colors duration-150',
                  )}
                  onClick={() => handleSortClick(col)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <SortIcon direction={isSorted ? currentSort?.direction : null} />
                    )}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-border bg-surface">
          {/* Loading skeleton */}
          {isLoading &&
            Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`} aria-hidden="true">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <Skeleton variant="text" height={16} width="80%" />
                  </td>
                ))}
              </tr>
            ))}

          {/* Datos */}
          {!isLoading &&
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-surface-2/50 transition-colors duration-100"
              >
                {columns.map((col) => {
                  const colKey = String(col.key)
                  const cellContent = col.cell
                    ? col.cell(row)
                    : String((row as Record<string, unknown>)[colKey] ?? '')

                  return (
                    <td
                      key={colKey}
                      className="px-4 py-3 font-sans text-sm text-text-primary"
                    >
                      {cellContent}
                    </td>
                  )
                })}
              </tr>
            ))}
        </tbody>
      </table>

      {/* Estado vacío */}
      {!isLoading && data.length === 0 && (
        <EmptyState
          icon={<PackageIcon />}
          title={emptyMessage}
          className="py-12"
        />
      )}
    </div>
  )
}
