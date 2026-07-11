'use client'

import { useState, useMemo, useEffect, useTransition, useRef } from 'react'
import Image from 'next/image'
import { GENDERS } from '@/lib/constants'
import { updateVariantStock, bulkUpdateStock } from '@/app/dashboard/inventario/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type InventoryRow = {
  id: string
  product_id: string
  sku: string
  size: string
  color: string
  color_hex: string
  stock: number
  product_name: string
  product_image: string | null
  product_gender: string
  product_type: string
  product_is_active: boolean
  category_name: string | null
  brand_name: string | null
}

interface Props {
  rows: InventoryRow[]
}

type StockStatus = 'all' | 'out' | 'low' | 'ok'

const PAGE_SIZE = 30

// ─── Inline stock cell ────────────────────────────────────────────────────────

function StockCell({
  row,
  onSaved,
}: {
  row: InventoryRow
  onSaved: (variantId: string, newStock: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(row.stock))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(String(row.stock))
  }, [row.stock])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  async function save() {
    const n = parseInt(value, 10)
    if (isNaN(n) || n < 0) { setError('Valor inválido'); return }
    if (n === row.stock) { setEditing(false); return }
    setSaving(true)
    setError(null)
    const res = await updateVariantStock(row.id, n)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    onSaved(row.id, n)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') { setValue(String(row.stock)); setEditing(false) }
  }

  const stock = row.stock
  const badgeClass =
    stock === 0
      ? 'bg-sale/10 text-sale'
      : stock <= 5
      ? 'bg-yellow-50 text-yellow-700'
      : 'bg-green-50 text-green-700'

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="w-16 px-2 py-1 text-xs font-body border border-black rounded focus:outline-none text-center"
        />
        {saving && (
          <svg className="animate-spin text-gray-text" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </svg>
        )}
        {error && <span className="text-[10px] text-sale">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Clic para editar"
      className={`text-xs font-heading font-semibold px-2 py-0.5 rounded cursor-pointer hover:opacity-70 transition-opacity ${badgeClass}`}
    >
      {stock} uds
    </button>
  )
}

// ─── Bulk modal ───────────────────────────────────────────────────────────────

function BulkModal({
  count,
  onConfirm,
  onCancel,
  isPending,
}: {
  count: number
  onConfirm: (stock: number) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [value, setValue] = useState('')
  const n = parseInt(value, 10)
  const valid = !isNaN(n) && n >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg border border-gray-light shadow-xl w-full max-w-sm p-6">
        <h3 className="font-heading font-bold text-black text-base mb-1">
          Ajustar stock masivo
        </h3>
        <p className="text-sm font-body text-gray-text mb-5">
          Se establecerá el mismo stock para{' '}
          <strong className="text-black">{count} variante{count !== 1 ? 's' : ''}</strong>.
        </p>
        <input
          type="number"
          min={0}
          placeholder="Nuevo stock (ej: 0, 10, 50…)"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          className="w-full px-3 py-2 border border-gray-light rounded text-sm font-body focus:border-black focus:outline-none mb-5"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-heading font-semibold border border-gray-light rounded hover:bg-gray-bg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => valid && onConfirm(n)}
            disabled={!valid || isPending}
            className="px-4 py-2 text-sm font-heading font-semibold bg-black text-white rounded hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending && (
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            )}
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Swatch ───────────────────────────────────────────────────────────────────

function Swatch({ hex }: { hex: string }) {
  const parts = hex?.split('|') ?? []
  const style =
    parts.length >= 2
      ? { background: `linear-gradient(135deg, ${parts[0]} 50%, ${parts[1]} 50%)` }
      : { backgroundColor: parts[0] || '#ccc' }
  const isWhite = parts[0]?.toLowerCase() === '#ffffff' || parts[0]?.toLowerCase() === '#fff'
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full shrink-0 ${isWhite ? 'border border-gray-300' : ''}`}
      style={style}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InventoryTable({ rows: initialRows }: Props) {
  const [rows, setRows] = useState(initialRows)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StockStatus>('all')
  const [genderFilter, setGenderFilter] = useState('')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showBulk, setShowBulk] = useState(false)
  const [isBulkPending, startBulkTransition] = useTransition()
  const [bulkError, setBulkError] = useState<string | null>(null)

  const checkboxAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setPage(1) }, [search, statusFilter, genderFilter])

  function handleSaved(variantId: string, newStock: number) {
    setRows(prev => prev.map(r => r.id === variantId ? { ...r, stock: newStock } : r))
  }

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (search) {
        const term = search.toLowerCase()
        if (!r.product_name.toLowerCase().includes(term) && !r.sku?.toLowerCase().includes(term)) return false
      }
      if (statusFilter === 'out' && r.stock !== 0) return false
      if (statusFilter === 'low' && (r.stock === 0 || r.stock > 5)) return false
      if (statusFilter === 'ok' && r.stock <= 5) return false
      if (genderFilter && r.product_gender !== genderFilter) return false
      return true
    })
  }, [rows, search, statusFilter, genderFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filteredIds = useMemo(() => filtered.map(r => r.id), [filtered])
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

  function handleBulkConfirm(stock: number) {
    setBulkError(null)
    startBulkTransition(async () => {
      const res = await bulkUpdateStock([...selected], stock)
      if (res.error) { setBulkError(res.error); return }
      setRows(prev => prev.map(r => selected.has(r.id) ? { ...r, stock } : r))
      setSelected(new Set())
      setShowBulk(false)
    })
  }

  // Summary metrics
  const totalVariants = rows.length
  const outOfStock = rows.filter(r => r.stock === 0).length
  const lowStock = rows.filter(r => r.stock > 0 && r.stock <= 5).length
  const totalUnits = rows.reduce((s, r) => s + r.stock, 0)

  return (
    <>
      {showBulk && (
        <BulkModal
          count={selected.size}
          onConfirm={handleBulkConfirm}
          onCancel={() => { setShowBulk(false); setBulkError(null) }}
          isPending={isBulkPending}
        />
      )}

      <div className="space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total variantes', value: totalVariants, color: 'text-black' },
            { label: 'Sin stock', value: outOfStock, color: 'text-sale', click: () => setStatusFilter('out') },
            { label: 'Stock bajo (≤5)', value: lowStock, color: 'text-yellow-600', click: () => setStatusFilter('low') },
            { label: 'Unidades totales', value: totalUnits, color: 'text-green-700' },
          ].map(card => (
            <button
              key={card.label}
              onClick={card.click}
              className={`bg-white rounded border border-gray-light p-4 text-left transition-colors ${card.click ? 'hover:border-black cursor-pointer' : 'cursor-default'}`}
            >
              <p className="text-xs font-body text-gray-text mb-1">{card.label}</p>
              <p className={`text-2xl font-heading font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded border border-gray-light p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por producto o SKU…"
                className="w-full pl-9 pr-3 py-2 border border-gray-light rounded text-sm font-body focus:border-black focus:outline-none transition-colors"
              />
            </div>

            {/* Stock status */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StockStatus)}
              className="border border-gray-light rounded px-3 py-2 text-sm font-body focus:border-black focus:outline-none transition-colors"
            >
              <option value="all">Todo el stock</option>
              <option value="out">Sin stock</option>
              <option value="low">Stock bajo (≤5)</option>
              <option value="ok">Disponible (&gt;5)</option>
            </select>

            {/* Gender */}
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="border border-gray-light rounded px-3 py-2 text-sm font-body focus:border-black focus:outline-none transition-colors"
            >
              <option value="">Todos los géneros</option>
              {GENDERS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-gray-text font-body">
                {filtered.length} variante{filtered.length !== 1 ? 's' : ''}
              </span>
              {(search || statusFilter !== 'all' || genderFilter) && (
                <button
                  onClick={() => { setSearch(''); setStatusFilter('all'); setGenderFilter('') }}
                  className="text-xs font-body text-gray-text hover:text-black underline underline-offset-2 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
          {bulkError && (
            <p className="mt-3 text-xs font-body text-sale bg-sale/5 border border-sale/20 rounded px-3 py-2">
              {bulkError}
            </p>
          )}
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="bg-accent text-white rounded px-4 py-3 flex items-center gap-4">
            <span className="text-sm font-heading font-semibold">
              {selected.size} variante{selected.size !== 1 ? 's' : ''} seleccionada{selected.size !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs font-heading font-semibold text-white/70 hover:text-white transition-colors"
              >
                Deseleccionar
              </button>
              <button
                onClick={() => setShowBulk(true)}
                className="flex items-center gap-1.5 text-xs font-heading font-semibold bg-gold text-white px-3 py-1.5 rounded hover:bg-gold/80 transition-colors"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                  <path d="M17.586 3.586a2 2 0 012.828 2.828l-8.207 8.207-3.207.379.379-3.207 8.207-8.207z" />
                </svg>
                Ajustar stock
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded border border-gray-light overflow-hidden">
          {paginated.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-text font-body">
                {search || statusFilter !== 'all' || genderFilter
                  ? 'No hay variantes con estos filtros.'
                  : 'No hay variantes de producto aún.'}
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
                    <th className="text-left px-4 py-3 w-14">Img</th>
                    <th className="text-left px-4 py-3 min-w-[180px]">Producto</th>
                    <th className="text-left px-4 py-3">SKU / Ref</th>
                    <th className="text-left px-4 py-3">Talla</th>
                    <th className="text-left px-4 py-3">Color</th>
                    <th className="text-left px-4 py-3">Stock</th>
                    <th className="text-left px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-light">
                  {paginated.map(row => {
                    const isChecked = selected.has(row.id)
                    const gender = GENDERS.find(g => g.value === row.product_gender)?.label ?? row.product_gender
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-gray-bg/50 transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(row.id)}
                            className="w-4 h-4 rounded border-gray-light accent-black cursor-pointer"
                          />
                        </td>

                        {/* Image */}
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded border border-gray-light overflow-hidden bg-gray-bg shrink-0">
                            {row.product_image ? (
                              <Image src={row.product_image} alt={row.product_name} width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-text">
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <polyline points="21 15 16 10 5 21" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Product name */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-black leading-tight line-clamp-1">{row.product_name}</p>
                          <p className="text-[11px] text-gray-text mt-0.5">
                            {gender}
                            {row.category_name ? ` · ${row.category_name}` : ''}
                            {row.brand_name ? ` · ${row.brand_name}` : ''}
                          </p>
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-body text-gray-text font-mono">
                            {row.sku || '—'}
                          </span>
                        </td>

                        {/* Size */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-heading font-semibold px-2 py-0.5 bg-gray-bg rounded border border-gray-light text-black">
                            {row.size || '—'}
                          </span>
                        </td>

                        {/* Color */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Swatch hex={row.color_hex} />
                            <span className="text-xs text-gray-text line-clamp-1">{row.color || '—'}</span>
                          </div>
                        </td>

                        {/* Stock (inline edit) */}
                        <td className="px-4 py-3">
                          <StockCell row={row} onSaved={handleSaved} />
                        </td>

                        {/* Active status */}
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded ${
                            row.product_is_active ? 'bg-green-50 text-green-700' : 'bg-gray-bg text-gray-text'
                          }`}>
                            {row.product_is_active ? 'Activo' : 'Inactivo'}
                          </span>
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
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-body border border-gray-light rounded hover:bg-gray-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page + i - 2
                  if (p < 1 || p > totalPages) return null
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs font-body rounded transition-colors ${
                        p === page ? 'bg-black text-white' : 'border border-gray-light hover:bg-gray-bg'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-body border border-gray-light rounded hover:bg-gray-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
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
