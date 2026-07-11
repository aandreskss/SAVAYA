'use client'

import { useState, useMemo, useEffect, useTransition, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { GENDERS, PRODUCT_TYPES } from '@/lib/constants'
import { toggleProductStatus, duplicateProduct, deleteProducts } from '@/app/dashboard/productos/actions'
import type { Category } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductRow = {
  id: string
  name: string
  slug: string
  description: string | null
  images: string[]
  tags: string[]
  gender: string
  type: string
  base_price: number
  sale_price: number | null
  wholesale_price: number | null
  divisa_price: number | null
  wholesale_divisa_price: number | null
  is_active: boolean
  is_new: boolean
  is_featured: boolean
  created_at: string
  category_id: string
  brand_id: string | null
  category: { name: string } | null
  brand: { name: string } | null
  product_variants: { size: string; color: string; color_hex: string; sku: string; stock: number }[]
}

interface Props {
  products: ProductRow[]
  categories: Pick<Category, 'id' | 'name'>[]
  brands: { id: string; name: string }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

type SortCol = 'name' | 'base_price' | 'stock' | 'created_at'
type SortDir = 'asc' | 'desc'
type ConfirmMode = 'none' | 'selected' | 'all'

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 14" fill="currentColor" className="opacity-30">
        <path d="M5 0l3 5H2L5 0zM5 14L2 9h6L5 14z" />
      </svg>
    )
  }
  return dir === 'asc' ? (
    <svg width="10" height="10" viewBox="0 0 10 7" fill="currentColor" className="text-black">
      <path d="M5 0l5 7H0L5 0z" />
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 10 7" fill="currentColor" className="text-black">
      <path d="M5 7L0 0h10L5 7z" />
    </svg>
  )
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  mode,
  count,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: {
  mode: ConfirmMode
  count: number
  isDeleting: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (mode === 'none') setChecked(false)
  }, [mode])

  if (mode === 'none') return null

  const isAll = mode === 'all'
  const label = isAll ? `todos los ${count} productos` : `${count} producto${count !== 1 ? 's' : ''} seleccionado${count !== 1 ? 's' : ''}`
  const canConfirm = !isAll || checked

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg border border-gray-light shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="shrink-0 w-10 h-10 rounded-full bg-sale/10 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-sale">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading font-bold text-black text-base leading-tight">
              ¿Eliminar {label}?
            </h3>
            <p className="text-sm text-gray-text font-body mt-1">
              Esta acción es permanente y no se puede deshacer. Se eliminarán también todas sus variantes.
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
              Entiendo que esta acción eliminará <strong className="text-black font-heading">todos los {count} productos</strong> de forma permanente e irreversible.
            </span>
          </label>
        )}

        {error && (
          <p className="mb-4 text-xs font-body text-sale bg-sale/5 border border-sale/20 rounded px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-heading font-semibold border border-gray-light rounded hover:bg-gray-bg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting || !canConfirm}
            className="px-4 py-2 text-sm font-heading font-semibold bg-sale text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            {isDeleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProductsTable({ products, categories, brands }: Props) {
  const [search, setSearch] = useState('')
  const [skuFilter, setSkuFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortCol, setSortCol] = useState<SortCol>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)

  // Per-row actions
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  // Bulk selection
  const [isExporting, setIsExporting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>('none')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  const checkboxAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setPage(1) }, [search, skuFilter, categoryFilter, genderFilter, brandFilter, statusFilter])

  // Deselect items that no longer exist (after delete)
  useEffect(() => {
    const existingIds = new Set(products.map(p => p.id))
    setSelected(prev => {
      const next = new Set([...prev].filter(id => existingIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [products])

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (skuFilter) {
        const term = skuFilter.toLowerCase()
        const match = p.product_variants.some(v => v.sku?.toLowerCase().includes(term))
        if (!match) return false
      }
      if (categoryFilter && p.category_id !== categoryFilter) return false
      if (genderFilter && p.gender !== genderFilter) return false
      if (brandFilter && p.brand_id !== brandFilter) return false
      if (statusFilter === 'active' && !p.is_active) return false
      if (statusFilter === 'inactive' && p.is_active) return false
      return true
    })
    result.sort((a, b) => {
      let av: string | number, bv: string | number
      switch (sortCol) {
        case 'name': av = a.name; bv = b.name; break
        case 'base_price': av = a.base_price; bv = b.base_price; break
        case 'stock':
          av = a.product_variants.reduce((s, v) => s + v.stock, 0)
          bv = b.product_variants.reduce((s, v) => s + v.stock, 0)
          break
        default: av = a.created_at; bv = b.created_at; break
      }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return result
  }, [products, search, skuFilter, categoryFilter, genderFilter, brandFilter, statusFilter, sortCol, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filteredIds = useMemo(() => filtered.map(p => p.id), [filtered])
  const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id))
  const isSomeSelected = selected.size > 0 && !isAllSelected

  // Sync indeterminate state on the "select all" checkbox
  useEffect(() => {
    if (checkboxAllRef.current) {
      checkboxAllRef.current.indeterminate = isSomeSelected
    }
  }, [isSomeSelected])

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredIds))
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggle(id: string, isActive: boolean) {
    setPendingId(id)
    startTransition(async () => {
      await toggleProductStatus(id, !isActive)
      setPendingId(null)
    })
  }

  function handleDuplicate(id: string) {
    setPendingId(id)
    startTransition(async () => {
      await duplicateProduct(id)
      setPendingId(null)
    })
  }

  function handleConfirmDelete() {
    const ids = confirmMode === 'all'
      ? products.map(p => p.id)
      : [...selected]

    setDeleteError(null)
    startDeleteTransition(async () => {
      const result = await deleteProducts(ids)
      if (result.error) {
        setDeleteError(result.error)
      } else {
        setSelected(new Set())
        setConfirmMode('none')
        setDeleteError(null)
      }
    })
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const XLSX = await import('xlsx')

      // Column headers
      const headers = [
        'Nombre', 'Género', 'Tipo', 'Categoría', 'Marca',
        'Precio base', 'Precio oferta', 'Precio al mayor', 'Precio divisa', 'Precio divisa al mayor',
        'Activo', 'Nuevo', 'Destacado',
        'Talla', 'Color', 'Color hex', 'SKU', 'Stock',
        'Descripción', 'Etiquetas', 'Imágenes', 'Slug',
      ]

      type Row = (string | number)[]
      const rows: Row[] = []

      for (const p of filtered) {
        const base: Row = [
          p.name,
          GENDERS.find(g => g.value === p.gender)?.label ?? p.gender,
          PRODUCT_TYPES.find(t => t.value === p.type)?.label ?? p.type,
          p.category?.name ?? '',
          p.brand?.name ?? '',
          p.base_price,
          p.sale_price ?? '',
          p.wholesale_price ?? '',
          p.divisa_price ?? '',
          p.wholesale_divisa_price ?? '',
          p.is_active ? 'Sí' : 'No',
          p.is_new ? 'Sí' : 'No',
          p.is_featured ? 'Sí' : 'No',
        ]

        const tail: Row = [
          p.description ?? '',
          (p.tags ?? []).join(', '),
          p.images.join(' | '),
          p.slug,
        ]

        if (p.product_variants.length === 0) {
          rows.push([...base, '', '', '', '', '', ...tail])
        } else {
          for (const v of p.product_variants) {
            rows.push([...base, v.size ?? '', v.color ?? '', v.color_hex ?? '', v.sku ?? '', v.stock, ...tail])
          }
        }
      }

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

      // Auto column widths (max 60 chars)
      const allRows = [headers, ...rows]
      ws['!cols'] = headers.map((_, colIdx) => ({
        wch: Math.min(60, Math.max(12, ...allRows.map(row => String(row[colIdx] ?? '').length + 2))),
      }))

      // Freeze header row
      ws['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0 }]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Productos')

      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `savaya-productos-${date}.xlsx`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <ConfirmModal
        mode={confirmMode}
        count={confirmMode === 'all' ? products.length : selected.size}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmMode('none'); setDeleteError(null) }}
      />

      <div className="space-y-4">
        {/* Filters bar */}
        <div className="bg-white rounded border border-gray-light p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text"
                width="14" height="14" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto…"
                className="w-full pl-9 pr-3 py-2 border border-gray-light rounded text-sm font-body focus:border-black focus:outline-none transition-colors"
              />
            </div>

            {/* SKU / Ref filter */}
            <div className="relative min-w-36">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-text"
                width="14" height="14" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2}
              >
                <rect x="3" y="3" width="18" height="4" rx="1" />
                <rect x="3" y="10" width="12" height="4" rx="1" />
                <rect x="3" y="17" width="8" height="4" rx="1" />
              </svg>
              <input
                type="text"
                value={skuFilter}
                onChange={e => setSkuFilter(e.target.value)}
                placeholder="Ref / SKU…"
                className="w-full pl-9 pr-3 py-2 border border-gray-light rounded text-sm font-body focus:border-black focus:outline-none transition-colors"
              />
            </div>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="border border-gray-light rounded px-3 py-2 text-sm font-body focus:border-black focus:outline-none transition-colors"
            >
              <option value="">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Gender filter */}
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

            {/* Brand filter */}
            {brands.length > 0 && (
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="border border-gray-light rounded px-3 py-2 text-sm font-body focus:border-black focus:outline-none transition-colors"
              >
                <option value="">Todas las marcas</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="border border-gray-light rounded px-3 py-2 text-sm font-body focus:border-black focus:outline-none transition-colors"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-gray-text font-body">
                {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
              </span>
              {filtered.length > 0 && (
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 text-xs font-heading font-semibold text-black hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Exportar ${filtered.length} producto${filtered.length !== 1 ? 's' : ''} a Excel`}
                >
                  {isExporting ? (
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                  {isExporting ? 'Exportando…' : 'Exportar Excel'}
                </button>
              )}
              {products.length > 0 && (
                <button
                  onClick={() => setConfirmMode('all')}
                  className="flex items-center gap-1.5 text-xs font-heading font-semibold text-sale hover:text-red-700 transition-colors"
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                  Eliminar todos
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="bg-accent text-white rounded px-4 py-3 flex items-center gap-4">
            <span className="text-sm font-heading font-semibold">
              {selected.size} producto{selected.size !== 1 ? 's' : ''} seleccionado{selected.size !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs font-heading font-semibold text-white/70 hover:text-white transition-colors"
              >
                Deseleccionar
              </button>
              <button
                onClick={() => setConfirmMode('selected')}
                className="flex items-center gap-1.5 text-xs font-heading font-semibold bg-sale text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
                Eliminar seleccionados
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded border border-gray-light overflow-hidden">
          {paginated.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-text font-body">
                {search || skuFilter || categoryFilter || genderFilter || brandFilter || statusFilter !== 'all'
                  ? 'No hay productos con estos filtros.'
                  : 'No hay productos aún.'}
              </p>
              {(search || skuFilter || categoryFilter || genderFilter || brandFilter || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setSkuFilter(''); setCategoryFilter(''); setGenderFilter(''); setBrandFilter(''); setStatusFilter('all') }}
                  className="mt-2 text-sm text-black underline underline-offset-2 font-body"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="border-b border-gray-light">
                  <tr className="text-[11px] text-gray-text font-heading font-semibold uppercase tracking-wider">
                    {/* Select all */}
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
                    <th className="text-left px-4 py-3 w-16">Imagen</th>
                    <th className="text-left px-4 py-3 min-w-[200px]">
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 hover:text-black transition-colors">
                        Nombre <SortIcon active={sortCol === 'name'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">Categoría</th>
                    <th className="text-left px-4 py-3">Género</th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => toggleSort('base_price')} className="flex items-center gap-1.5 hover:text-black transition-colors">
                        Precio <SortIcon active={sortCol === 'base_price'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">
                      <button onClick={() => toggleSort('stock')} className="flex items-center gap-1.5 hover:text-black transition-colors">
                        Stock <SortIcon active={sortCol === 'stock'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-light">
                  {paginated.map(p => {
                    const totalStock = p.product_variants.reduce((s, v) => s + v.stock, 0)
                    const gender = GENDERS.find(g => g.value === p.gender)?.label ?? p.gender
                    const type = PRODUCT_TYPES.find(t => t.value === p.type)?.label ?? p.type
                    const isRowPending = pendingId === p.id && isPending
                    const isChecked = selected.has(p.id)

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-bg/50 transition-colors ${isRowPending ? 'opacity-50' : ''} ${isChecked ? 'bg-blue-50/40' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(p.id)}
                            className="w-4 h-4 rounded border-gray-light accent-black cursor-pointer"
                          />
                        </td>

                        {/* Image */}
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded border border-gray-light overflow-hidden bg-gray-bg shrink-0">
                            {p.images[0] ? (
                              <Image src={p.images[0]} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
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

                        {/* Name */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-black leading-tight line-clamp-2">{p.name}</p>
                          <p className="text-[11px] text-gray-text mt-0.5">{type}</p>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <p className="text-gray-text text-sm">{type}</p>
                          {p.category?.name && (
                            <p className="text-[11px] text-gray-text/60 mt-0.5">{p.category.name}</p>
                          )}
                        </td>

                        {/* Gender */}
                        <td className="px-4 py-3 text-gray-text">{gender}</td>

                        {/* Price */}
                        <td className="px-4 py-3">
                          {p.sale_price ? (
                            <div>
                              <p className="text-sale font-semibold font-heading text-xs">{formatPrice(p.sale_price)}</p>
                              <p className="text-gray-text line-through text-[11px]">{formatPrice(p.base_price)}</p>
                            </div>
                          ) : (
                            <p className="font-heading font-semibold text-xs text-black">{formatPrice(p.base_price)}</p>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3">
                          <span className={`text-xs font-heading font-semibold px-2 py-0.5 rounded ${
                            totalStock === 0 ? 'bg-sale/10 text-sale'
                            : totalStock <= 5 ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-green-50 text-green-700'
                          }`}>
                            {totalStock} uds
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-heading font-semibold px-2 py-0.5 rounded ${
                            p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-bg text-gray-text'
                          }`}>
                            {p.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/dashboard/productos/${p.id}`}
                              className="p-1.5 text-gray-text hover:text-black transition-colors rounded hover:bg-gray-bg"
                              title="Editar"
                            >
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDuplicate(p.id)}
                              disabled={isRowPending}
                              className="p-1.5 text-gray-text hover:text-black transition-colors rounded hover:bg-gray-bg disabled:cursor-not-allowed"
                              title="Duplicar"
                            >
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggle(p.id, p.is_active)}
                              disabled={isRowPending}
                              className={`p-1.5 transition-colors rounded hover:bg-gray-bg disabled:cursor-not-allowed ${
                                p.is_active ? 'text-green-600 hover:text-gray-text' : 'text-gray-text hover:text-green-600'
                              }`}
                              title={p.is_active ? 'Desactivar' : 'Activar'}
                            >
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {p.is_active ? (
                                  <>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </>
                                ) : (
                                  <>
                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                  </>
                                )}
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
