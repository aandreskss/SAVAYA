'use client'

import { useState, useMemo, useEffect, useTransition, useRef } from 'react'
import Link from 'next/link'
import { formatPrice, formatDate } from '@/lib/utils'
import { ORDER_STATUS_CONFIG } from '@/lib/constants'
import { deleteOrders, pauseOrders } from '@/app/dashboard/pedidos/actions'
import type { OrderStatus } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ShippingAddress = {
  name: string
  address_line: string
  city: string
  department: string | null
  phone: string | null
}

export type OrderRow = {
  id: string
  order_number: string
  email: string
  status: string
  total: number
  payment_method: string | null
  shipping_address: ShippingAddress
  created_at: string
}

interface Props {
  orders: OrderRow[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const STATUS_COLOR_CLASSES: Record<string, string> = {
  gray: 'bg-gray-bg text-gray-text',
  green: 'bg-green-50 text-green-700',
  blue: 'bg-blue-50 text-blue-700',
  red: 'bg-red-50 text-red-700',
  orange: 'bg-orange-50 text-orange-700',
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportToCSV(rows: OrderRow[]) {
  const headers = ['Número', 'Cliente', 'Email', 'Fecha', 'Estado', 'Método de pago', 'Total']
  const data = rows.map((o) => [
    o.order_number,
    o.shipping_address?.name ?? '',
    o.email,
    new Date(o.created_at).toLocaleDateString('es-VE'),
    ORDER_STATUS_CONFIG[o.status as OrderStatus]?.label ?? o.status,
    o.payment_method ?? '',
    o.total,
  ])

  const csv = [headers, ...data]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({
  count,
  isAll,
  isPending,
  error,
  onConfirm,
  onCancel,
}: {
  count: number
  isAll: boolean
  isPending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const [checked, setChecked] = useState(false)
  const canConfirm = !isAll || checked

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg border border-gray-light shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="shrink-0 w-10 h-10 rounded-full bg-sale/10 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-sale">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading font-bold text-black text-base leading-tight">
              ¿Eliminar {isAll ? `todos los ${count} pedidos` : `${count} pedido${count !== 1 ? 's' : ''}`}?
            </h3>
            <p className="text-sm text-gray-text font-body mt-1">
              Esta acción es permanente. Se eliminarán también todos los ítems asociados.
            </p>
          </div>
        </div>

        {isAll && (
          <label className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 rounded border-gray-light accent-sale cursor-pointer"
            />
            <span className="text-xs font-body text-gray-text leading-relaxed">
              Entiendo que esta acción eliminará <strong className="text-black font-heading">todos los {count} pedidos</strong> de forma permanente e irreversible.
            </span>
          </label>
        )}

        {error && (
          <p className="mb-4 text-xs font-body text-sale bg-sale/5 border border-sale/20 rounded px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-heading font-semibold border border-gray-light rounded hover:bg-gray-bg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending || !canConfirm}
            className="px-4 py-2 text-sm font-heading font-semibold bg-sale text-white rounded hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending && (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            )}
            {isPending ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm pause modal ──────────────────────────────────────────────────────

function ConfirmPauseModal({
  count,
  pause,
  isPending,
  error,
  onConfirm,
  onCancel,
}: {
  count: number
  pause: boolean
  isPending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg border border-gray-light shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="shrink-0 w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-orange-500">
              {pause ? (
                <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>
              ) : (
                <polygon points="5 3 19 12 5 21 5 3" />
              )}
            </svg>
          </div>
          <div>
            <h3 className="font-heading font-bold text-black text-base leading-tight">
              {pause ? 'Pausar' : 'Reanudar'} {count} pedido{count !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-text font-body mt-1">
              {pause
                ? 'Los pedidos pasarán a estado "En pausa". Puedes reanudarlos cuando quieras.'
                : 'Los pedidos volverán a estado "Pendiente" y estarán activos nuevamente.'}
            </p>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-xs font-body text-sale bg-sale/5 border border-sale/20 rounded px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-heading font-semibold border border-gray-light rounded hover:bg-gray-bg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-heading font-semibold bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {isPending && (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            )}
            {isPending ? (pause ? 'Pausando…' : 'Reanudando…') : (pause ? 'Pausar' : 'Reanudar')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type ConfirmDeleteMode = 'none' | 'selected' | 'all'
type ConfirmPauseMode = 'none' | 'pause' | 'resume'

export default function OrdersTable({ orders: initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const checkboxAllRef = useRef<HTMLInputElement>(null)

  // Modals
  const [deleteMode, setDeleteMode] = useState<ConfirmDeleteMode>('none')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  const [pauseMode, setPauseMode] = useState<ConfirmPauseMode>('none')
  const [pauseError, setPauseError] = useState<string | null>(null)
  const [isPausing, startPauseTransition] = useTransition()

  useEffect(() => { setPage(1) }, [search, statusFilter, paymentFilter, dateFrom, dateTo])

  // Deselect removed orders
  useEffect(() => {
    const ids = new Set(orders.map(o => o.id))
    setSelected(prev => {
      const next = new Set([...prev].filter(id => ids.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [orders])

  const paymentMethods = useMemo(
    () => [...new Set(orders.map(o => o.payment_method).filter((m): m is string => Boolean(m)))],
    [orders]
  )

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (search) {
        const q = search.toLowerCase()
        if (!o.order_number.toLowerCase().includes(q) && !o.email.toLowerCase().includes(q)) return false
      }
      if (statusFilter && o.status !== statusFilter) return false
      if (paymentFilter && o.payment_method !== paymentFilter) return false
      if (dateFrom) {
        const from = new Date(dateFrom); from.setHours(0, 0, 0, 0)
        if (new Date(o.created_at) < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo); to.setHours(23, 59, 59, 999)
        if (new Date(o.created_at) > to) return false
      }
      return true
    })
  }, [orders, search, statusFilter, paymentFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filteredIds = useMemo(() => filtered.map(o => o.id), [filtered])
  const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id))
  const isSomeSelected = selected.size > 0 && !isAllSelected

  useEffect(() => {
    if (checkboxAllRef.current) checkboxAllRef.current.indeterminate = isSomeSelected
  }, [isSomeSelected])

  function toggleSelectAll() {
    setSelected(isAllSelected ? new Set() : new Set(filteredIds))
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function clearFilters() {
    setSearch(''); setStatusFilter(''); setPaymentFilter(''); setDateFrom(''); setDateTo('')
  }

  const hasFilters = search || statusFilter || paymentFilter || dateFrom || dateTo

  // ─── Delete handlers ─────────────────────────────────────────────────────

  function handleConfirmDelete() {
    const ids = deleteMode === 'all' ? orders.map(o => o.id) : [...selected]
    setDeleteError(null)
    startDeleteTransition(async () => {
      const res = await deleteOrders(ids)
      if ('error' in res) { setDeleteError(res.error); return }
      setOrders(prev => prev.filter(o => !ids.includes(o.id)))
      setSelected(new Set())
      setDeleteMode('none')
    })
  }

  // ─── Pause handlers ──────────────────────────────────────────────────────

  function handleConfirmPause() {
    const ids = [...selected]
    const pause = pauseMode === 'pause'
    setPauseError(null)
    startPauseTransition(async () => {
      const res = await pauseOrders(ids, pause)
      if ('error' in res) { setPauseError(res.error); return }
      setOrders(prev => prev.map(o =>
        ids.includes(o.id) ? { ...o, status: pause ? 'on_hold' : 'pending' } : o
      ))
      setSelected(new Set())
      setPauseMode('none')
    })
  }

  function handleSinglePause(order: OrderRow) {
    const pause = order.status !== 'on_hold'
    startPauseTransition(async () => {
      const res = await pauseOrders([order.id], pause)
      if ('error' in res) return
      setOrders(prev => prev.map(o =>
        o.id === order.id ? { ...o, status: pause ? 'on_hold' : 'pending' } : o
      ))
    })
  }

  function handleSingleDelete(orderId: string) {
    startDeleteTransition(async () => {
      const res = await deleteOrders([orderId])
      if ('error' in res) return
      setOrders(prev => prev.filter(o => o.id !== orderId))
    })
  }

  const selectedHasPaused = [...selected].some(id => orders.find(o => o.id === id)?.status === 'on_hold')
  const selectedAllPaused = selected.size > 0 && [...selected].every(id => orders.find(o => o.id === id)?.status === 'on_hold')

  return (
    <>
      {deleteMode !== 'none' && (
        <ConfirmDeleteModal
          count={deleteMode === 'all' ? orders.length : selected.size}
          isAll={deleteMode === 'all'}
          isPending={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => { setDeleteMode('none'); setDeleteError(null) }}
        />
      )}
      {pauseMode !== 'none' && (
        <ConfirmPauseModal
          count={selected.size}
          pause={pauseMode === 'pause'}
          isPending={isPausing}
          error={pauseError}
          onConfirm={handleConfirmPause}
          onCancel={() => { setPauseMode('none'); setPauseError(null) }}
        />
      )}

      <div className="space-y-4">
        {/* Filters bar */}
        <div className="bg-white rounded border border-gray-light p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-56">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por número o email…"
                className="w-full pl-9 pr-3 py-2 border border-gray-light rounded text-sm font-body focus:border-black focus:outline-none transition-colors"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-light rounded px-3 py-2 text-sm font-body focus:border-black focus:outline-none transition-colors"
            >
              <option value="">Todos los estados</option>
              {(Object.entries(ORDER_STATUS_CONFIG) as [OrderStatus, { label: string }][]).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Payment method */}
            {paymentMethods.length > 0 && (
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="border border-gray-light rounded px-3 py-2 text-sm font-body focus:border-black focus:outline-none transition-colors"
              >
                <option value="">Todos los métodos</option>
                {paymentMethods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            <div className="ml-auto flex items-center gap-3">
              {/* Export CSV */}
              <button
                onClick={() => exportToCSV(filtered)}
                className="flex items-center gap-1.5 text-xs font-heading font-semibold text-black hover:text-accent transition-colors"
                title={`Exportar ${filtered.length} pedido${filtered.length !== 1 ? 's' : ''} a CSV`}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar CSV
              </button>

              {/* Delete all */}
              {orders.length > 0 && (
                <button
                  onClick={() => setDeleteMode('all')}
                  className="flex items-center gap-1.5 text-xs font-heading font-semibold text-sale hover:text-red-700 transition-colors"
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                  Eliminar todos
                </button>
              )}
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-text font-body">Fecha:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-light rounded px-2 py-1.5 text-sm font-body focus:border-black focus:outline-none transition-colors" />
            <span className="text-gray-text text-sm">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-light rounded px-2 py-1.5 text-sm font-body focus:border-black focus:outline-none transition-colors" />
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-gray-text hover:text-black underline underline-offset-2 font-body ml-1">
                Limpiar filtros
              </button>
            )}
            <span className="text-xs text-gray-text font-body ml-auto">
              {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="bg-accent text-white rounded px-4 py-3 flex items-center gap-4">
            <span className="text-sm font-heading font-semibold">
              {selected.size} pedido{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs font-heading font-semibold text-white/70 hover:text-white transition-colors"
              >
                Deseleccionar
              </button>

              {/* Pause / resume */}
              {!selectedAllPaused ? (
                <button
                  onClick={() => setPauseMode('pause')}
                  className="flex items-center gap-1.5 text-xs font-heading font-semibold bg-orange-500 text-white px-3 py-1.5 rounded hover:bg-orange-600 transition-colors"
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                  Pausar
                </button>
              ) : null}
              {selectedHasPaused ? (
                <button
                  onClick={() => setPauseMode('resume')}
                  className="flex items-center gap-1.5 text-xs font-heading font-semibold bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Reanudar
                </button>
              ) : null}

              {/* Delete selected */}
              <button
                onClick={() => setDeleteMode('selected')}
                className="flex items-center gap-1.5 text-xs font-heading font-semibold bg-sale text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
                Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded border border-gray-light overflow-hidden">
          {paginated.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-text font-body">
                {hasFilters ? 'No hay pedidos con estos filtros.' : 'No hay pedidos aún.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-gray-light">
                  <tr className="text-[11px] text-gray-text font-heading font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3 w-10">
                      <input
                        ref={checkboxAllRef}
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-light accent-black cursor-pointer"
                        title="Seleccionar todos los resultados"
                      />
                    </th>
                    <th className="text-left px-4 py-3">Pedido</th>
                    <th className="text-left px-4 py-3">Cliente</th>
                    <th className="text-left px-4 py-3">Fecha</th>
                    <th className="text-left px-4 py-3">Estado</th>
                    <th className="text-left px-4 py-3">Pago</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-light">
                  {paginated.map(order => {
                    const statusCfg = ORDER_STATUS_CONFIG[order.status as OrderStatus]
                    const colorClass = statusCfg
                      ? STATUS_COLOR_CLASSES[statusCfg.color]
                      : 'bg-gray-bg text-gray-text'
                    const isChecked = selected.has(order.id)
                    const isPaused = order.status === 'on_hold'

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-bg/50 transition-colors ${isChecked ? 'bg-blue-50/40' : ''} ${isPaused ? 'opacity-60' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(order.id)}
                            className="w-4 h-4 rounded border-gray-light accent-black cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-heading font-semibold text-xs text-black">
                          {order.order_number}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-black text-xs">{order.shipping_address?.name ?? '—'}</p>
                          <p className="text-[11px] text-gray-text">{order.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-text text-xs">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded ${colorClass}`}>
                            {statusCfg?.label ?? order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-text text-xs capitalize">
                          {order.payment_method ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-heading font-semibold text-xs text-black">
                          {formatPrice(order.total)}
                        </td>

                        {/* Row actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Ver */}
                            <Link
                              href={`/dashboard/pedidos/${order.id}`}
                              className="p-1.5 text-gray-text hover:text-black transition-colors rounded hover:bg-gray-bg"
                              title="Ver detalle"
                            >
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                              </svg>
                            </Link>

                            {/* Pause / resume */}
                            <button
                              onClick={() => handleSinglePause(order)}
                              disabled={isPausing}
                              title={isPaused ? 'Reanudar pedido' : 'Pausar pedido'}
                              className={`p-1.5 transition-colors rounded hover:bg-gray-bg disabled:cursor-not-allowed ${
                                isPaused ? 'text-green-600 hover:text-green-700' : 'text-orange-500 hover:text-orange-600'
                              }`}
                            >
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {isPaused ? (
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                ) : (
                                  <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>
                                )}
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleSingleDelete(order.id)}
                              disabled={isDeleting}
                              title="Eliminar pedido"
                              className="p-1.5 text-gray-text hover:text-sale transition-colors rounded hover:bg-gray-bg disabled:cursor-not-allowed"
                            >
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-light">
              <p className="text-xs text-gray-text font-body">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-body border border-gray-light rounded hover:bg-gray-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page + i - 2
                  if (p < 1 || p > totalPages) return null
                  return (
                    <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 text-xs font-body rounded transition-colors ${p === page ? 'bg-black text-white' : 'border border-gray-light hover:bg-gray-bg'}`}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-body border border-gray-light rounded hover:bg-gray-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
