'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useCallback, useState } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Pagination } from '@/shared/ui/Pagination'
import { CustomerTagBadge } from './CustomerTagBadge'
import { TAG_CONFIG } from '../types'
import type { CustomerListItem, AdminCustomerFilters, CustomerTag } from '../types'
import { cn } from '@/shared/lib/utils'
import { toWaPhone } from '@/shared/lib/phone'
import { setCustomerStatusAction, deleteCustomerAction } from '../actions'
import { toast } from '@/shared/ui/Toast'

const TAG_OPTIONS = Object.entries(TAG_CONFIG) as [CustomerTag, { label: string; color: string }][]

// ---------------------------------------------------------------------------
// Row actions
// ---------------------------------------------------------------------------

function BlockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  )
}

function UnblockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  )
}

function RowActions({
  customer,
  onStatusChange,
  onDeleted,
}: {
  customer: CustomerListItem
  onStatusChange: (id: string, isActive: boolean) => void
  onDeleted: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleToggleStatus() {
    const next = !customer.isActive
    startTransition(async () => {
      const res = await setCustomerStatusAction(customer.id, next)
      if (res.success) {
        onStatusChange(customer.id, next)
        toast.success(next ? 'Cliente activado' : 'Cliente bloqueado')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteCustomerAction(customer.id)
      if (res.success) {
        onDeleted(customer.id)
        toast.success('Cliente eliminado')
      } else {
        setConfirmDelete(false)
        toast.error(res.error)
      }
    })
  }

  if (confirmDelete) {
    return (
      <span className="inline-flex items-center gap-1 text-xs">
        <span className="text-text-secondary whitespace-nowrap">¿Eliminar?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="font-medium text-error hover:text-error/80 px-1.5 py-0.5 rounded transition-colors disabled:opacity-50"
        >
          {isPending ? '…' : 'Sí'}
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="text-text-secondary hover:text-text-primary px-1.5 py-0.5 rounded transition-colors"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        onClick={handleToggleStatus}
        disabled={isPending}
        title={customer.isActive ? 'Bloquear cliente' : 'Activar cliente'}
        className={cn(
          'p-1.5 rounded-md border transition-colors disabled:opacity-40',
          customer.isActive
            ? 'border-border text-text-muted hover:text-error hover:border-error/30'
            : 'border-success/30 text-success hover:bg-success/5',
        )}
      >
        {customer.isActive ? <BlockIcon /> : <UnblockIcon />}
      </button>
      <button
        onClick={() => setConfirmDelete(true)}
        disabled={isPending}
        title="Eliminar cliente"
        className="p-1.5 rounded-md border border-border text-text-muted hover:text-error hover:border-error/30 transition-colors disabled:opacity-40"
      >
        <TrashIcon />
      </button>
    </span>
  )
}

// ---------------------------------------------------------------------------
// CustomersTable
// ---------------------------------------------------------------------------

type Props = {
  items: CustomerListItem[]
  total: number
  filters: AdminCustomerFilters
}

export function CustomersTable({ items: initialItems, total, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRouting, startRoutingTransition] = useTransition()

  // Optimistic local state so block/delete reflects instantly without page reload
  const [localItems, setLocalItems] = useState<CustomerListItem[]>(initialItems)

  function handleStatusChange(id: string, isActive: boolean) {
    setLocalItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive } : c)),
    )
  }

  function handleDeleted(id: string) {
    setLocalItems((prev) => prev.filter((c) => c.id !== id))
  }

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      if (key !== 'page') params.delete('page')
      startRoutingTransition(() => router.push(`${pathname}?${params.toString()}`))
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
        <select
          value={filters.status ?? ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="blocked">Bloqueados</option>
        </select>
      </div>

      {/* Table */}
      <div className={cn('overflow-x-auto rounded-xl border border-border', isRouting && 'opacity-60 pointer-events-none')}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-text-secondary">Cliente</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Ubicación</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Pedidos</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden sm:table-cell">Total gastado</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden lg:table-cell">Último pedido</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Etiquetas</th>
              <th className="px-4 py-3 font-medium text-text-secondary text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {localItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12">
                  <EmptyState
                    title="Sin clientes"
                    description={
                      filters.search || filters.tag || filters.status
                        ? 'Intenta con otros filtros'
                        : 'Aún no hay clientes registrados'
                    }
                  />
                </td>
              </tr>
            ) : (
              localItems.map((c) => (
                <tr
                  key={c.id}
                  className={cn(
                    'hover:bg-surface-2/50 transition-colors',
                    !c.isActive && 'bg-error/[0.02]',
                  )}
                >
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
                          Bloqueado
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
                  <td className="px-4 py-3 text-right">
                    <RowActions
                      customer={c}
                      onStatusChange={handleStatusChange}
                      onDeleted={handleDeleted}
                    />
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
