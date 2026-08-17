'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useCallback } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Pagination } from '@/shared/ui/Pagination'
import { OrderStatusBadge, ProofStatusBadge } from './OrderStatusBadge'
import type { AdminOrderListItem, AdminOrderFilters } from '../types'
import type { OrderStatus } from '@/domains/orders/state-machine'
import { cn } from '@/shared/lib/utils'

const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '',                    label: 'Todos los estados' },
  { value: 'pending_payment',     label: 'Pago pendiente' },
  { value: 'payment_under_review',label: 'En revisión' },
  { value: 'payment_rejected',    label: 'Pago rechazado' },
  { value: 'paid',                label: 'Pagado' },
  { value: 'preparing',           label: 'Preparando' },
  { value: 'shipped',             label: 'Enviado' },
  { value: 'delivered',           label: 'Entregado' },
  { value: 'cancelled',           label: 'Cancelado' },
  { value: 'refunded',            label: 'Reembolsado' },
]

type Props = {
  items: AdminOrderListItem[]
  total: number
  filters: AdminOrderFilters
}

export function OrdersTable({ items, total, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      if (key !== 'page') params.delete('page')
      startTransition(() => router.push(`${pathname}?${params.toString()}`))
    },
    [pathname, router, searchParams],
  )

  const totalPages = Math.ceil(total / 20)
  const currentPage = filters.page ?? 1

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Buscar por #pedido, cliente o email…"
          defaultValue={filters.search ?? ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
        />
        <select
          value={filters.status ?? ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={cn('overflow-x-auto rounded-xl border border-border', isPending && 'opacity-60 pointer-events-none')}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-text-secondary">Pedido</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Cliente</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Fecha</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Total</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden lg:table-cell">Método</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Estado</th>
              <th className="px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12">
                  <EmptyState
                    title="Sin pedidos"
                    description={filters.search || filters.status ? 'Intenta con otros filtros' : 'Aún no hay pedidos registrados'}
                  />
                </td>
              </tr>
            ) : (
              items.map((order) => (
                <tr key={order.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${order.orderNumber}`}
                      className="font-mono text-xs font-medium text-text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary leading-tight">{order.customerName}</div>
                    <div className="text-xs text-text-secondary">{order.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('es-VE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">${order.totalUsd}</div>
                    <div className="text-xs text-text-secondary">Bs. {order.totalBs}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                    {order.paymentMethodName ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {order.proofStatus ? (
                      <ProofStatusBadge status={order.proofStatus} />
                    ) : (
                      <span className="text-text-secondary text-xs">—</span>
                    )}
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
        {total} pedido{total !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
