'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useCallback } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Pagination } from '@/shared/ui/Pagination'
import { CustomerTagBadge } from './CustomerTagBadge'
import { TAG_CONFIG } from '../types'
import type { CustomerListItem, AdminCustomerFilters, CustomerTag } from '../types'
import { cn } from '@/shared/lib/utils'
import { toWaPhone } from '@/shared/lib/phone'

const TAG_OPTIONS = Object.entries(TAG_CONFIG) as [CustomerTag, { label: string; color: string }][]

type Props = {
  items: CustomerListItem[]
  total: number
  filters: AdminCustomerFilters
}

export function CustomersTable({ items, total, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      if (key !== 'page') params.delete('page')
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [pathname, router, searchParams],
  )

  const totalPages = Math.ceil(total / 25)
  const currentPage = filters.page ?? 1

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre, email o teléfono…"
          defaultValue={filters.search ?? ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
        />
        <select
          value={filters.tag ?? ''}
          onChange={(e) => updateFilter('tag', e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
        >
          <option value="">Todas las etiquetas</option>
          {TAG_OPTIONS.map(([tag, cfg]) => (
            <option key={tag} value={tag}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={cn('overflow-x-auto rounded-xl border border-border', isPending && 'opacity-60 pointer-events-none')}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-text-secondary">Cliente</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Ubicación</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Pedidos</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden sm:table-cell">Total gastado</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden lg:table-cell">Último pedido</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Etiquetas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12">
                  <EmptyState
                    title="Sin clientes"
                    description={
                      filters.search || filters.tag
                        ? 'Intenta con otros filtros'
                        : 'Aún no hay clientes registrados'
                    }
                  />
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <Link
                        href={`/admin/clientes/${c.id}`}
                        className="font-medium text-text-primary hover:underline"
                      >
                        {c.firstName} {c.lastName}
                      </Link>
                      {!c.isActive && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-error/10 text-error shrink-0">
                          Bloqueada
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-secondary">{c.email}</span>
                    {c.whatsapp && (
                      <a
                        href={`https://wa.me/${toWaPhone(c.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-success block hover:underline"
                      >
                        WA: {c.whatsapp}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs hidden md:table-cell">
                    {c.city && c.state ? `${c.city}, ${c.state}` : c.city ?? c.state ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {c.totalOrders}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="font-medium">${c.totalSpentUsd}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs hidden lg:table-cell whitespace-nowrap">
                    {c.lastOrderAt
                      ? new Date(c.lastOrderAt).toLocaleDateString('es-VE', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.length > 0
                        ? c.tags.map((tag) => <CustomerTagBadge key={tag} tag={tag} />)
                        : <span className="text-text-secondary text-xs">—</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => updateFilter('page', p.toString())}
        />
      )}

      <p className="text-xs text-text-secondary text-right">
        {total} cliente{total !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
