'use client'

import { useTransition, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/shared/ui/Badge'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { Pagination } from '@/shared/ui/Pagination'
import { toast } from '@/shared/ui'
import {
  archiveProductAction,
  restoreProductAction,
  publishProductAction,
  unpublishProductAction,
  duplicateProductAction,
} from '../actions'
import type { AdminProductRow, ColorOption, SizeOption } from '../types'

type Props = {
  rows: AdminProductRow[]
  total: number
  page: number
  limit: number
  search: string
  status: string
  sku: string
  colorId: string
  sizeId: string
  minPrice: string
  maxPrice: string
  minStock: string
  maxStock: string
  categoryId: string
  categoryName: string
  collectionId: string
  collectionName: string
  colors: ColorOption[]
  sizes: SizeOption[]
}

function productStatus(row: AdminProductRow): { label: string; variant: 'success' | 'warning' | 'default' | 'error' } {
  if (!row.isActive) return { label: 'Archivado', variant: 'error' }
  if (!row.publishedAt) return { label: 'Borrador', variant: 'default' }
  if (new Date(row.publishedAt) > new Date()) return { label: 'Programado', variant: 'warning' }
  return { label: 'Publicado', variant: 'success' }
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M1 3h13M3.5 7.5h8M6 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const inputCls =
  'h-9 w-full px-3 rounded-sm border border-border bg-surface font-sans text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold'

const selectCls =
  'h-9 w-full px-3 rounded-sm border border-border bg-surface font-sans text-sm text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-gold'

export function ProductsTable({
  rows, total, page, limit,
  search, status, sku, colorId, sizeId,
  minPrice, maxPrice, minStock, maxStock,
  categoryId, categoryName, collectionId, collectionName, colors, sizes,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<AdminProductRow | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(
    !!(sku || colorId || sizeId || minPrice || maxPrice || minStock || maxStock),
  )

  // Local state for debounced text/number inputs
  const [localSearch, setLocalSearch] = useState(search)
  const [localSku, setLocalSku] = useState(sku)
  const [localMinPrice, setLocalMinPrice] = useState(minPrice)
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice)
  const [localMinStock, setLocalMinStock] = useState(minStock)
  const [localMaxStock, setLocalMaxStock] = useState(maxStock)

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skuDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const priceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stockDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.ceil(total / limit)

  // Count of active advanced filters (not search/status)
  const advancedFilterCount = [sku, colorId, sizeId, minPrice, maxPrice, minStock, maxStock, categoryId, collectionId]
    .filter(Boolean).length

  function pushParams(updates: Record<string, string>) {
    const current: Record<string, string> = {
      search: localSearch,
      status,
      sku: localSku,
      colorId,
      sizeId,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      minStock: localMinStock,
      maxStock: localMaxStock,
      categoryId,
      categoryName,
      collectionId,
      collectionName,
    }
    const merged = { ...current, ...updates, page: updates.page ?? '1' }
    const sp = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== '') sp.set(k, v)
    })
    router.push(`/admin/productos?${sp.toString()}`)
  }

  function clearAdvancedFilters() {
    setLocalSku('')
    setLocalMinPrice('')
    setLocalMaxPrice('')
    setLocalMinStock('')
    setLocalMaxStock('')
    const sp = new URLSearchParams()
    if (localSearch) sp.set('search', localSearch)
    if (status) sp.set('status', status)
    router.push(`/admin/productos?${sp.toString()}`)
  }

  function handleSearchChange(value: string) {
    setLocalSearch(value)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => {
      pushParams({ search: value, page: '1' })
    }, 350)
  }

  function handleSkuChange(value: string) {
    setLocalSku(value)
    if (skuDebounce.current) clearTimeout(skuDebounce.current)
    skuDebounce.current = setTimeout(() => {
      pushParams({ sku: value, page: '1' })
    }, 400)
  }

  function handlePriceChange(field: 'minPrice' | 'maxPrice', value: string) {
    if (field === 'minPrice') setLocalMinPrice(value)
    else setLocalMaxPrice(value)
    if (priceDebounce.current) clearTimeout(priceDebounce.current)
    priceDebounce.current = setTimeout(() => {
      pushParams({
        minPrice: field === 'minPrice' ? value : localMinPrice,
        maxPrice: field === 'maxPrice' ? value : localMaxPrice,
        page: '1',
      })
    }, 500)
  }

  function handleStockChange(field: 'minStock' | 'maxStock', value: string) {
    if (field === 'minStock') setLocalMinStock(value)
    else setLocalMaxStock(value)
    if (stockDebounce.current) clearTimeout(stockDebounce.current)
    stockDebounce.current = setTimeout(() => {
      pushParams({
        minStock: field === 'minStock' ? value : localMinStock,
        maxStock: field === 'maxStock' ? value : localMaxStock,
        page: '1',
      })
    }, 500)
  }

  async function handleAction(id: string, action: () => Promise<{ success: boolean; error?: string }>) {
    setPendingId(id)
    startTransition(async () => {
      const result = await action()
      setPendingId(null)
      if (!result.success) toast.error(result.error ?? 'Error')
    })
  }

  async function handleDuplicate(id: string) {
    setPendingId(id)
    startTransition(async () => {
      const result = await duplicateProductAction(id)
      setPendingId(null)
      if (!result.success) {
        toast.error(result.error ?? 'Error al duplicar')
        return
      }
      toast.success('Producto duplicado')
      router.push(`/admin/productos/${result.data.id}`)
    })
  }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre..."
            className="h-11 w-full pl-10 pr-4 rounded-sm border border-border bg-surface font-sans text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
          />
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={status}
            onChange={(e) => pushParams({ status: e.target.value, page: '1' })}
            className="h-11 px-4 pr-8 appearance-none rounded-sm border border-border bg-surface font-sans text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
          >
            <option value="">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
            <option value="archived">Archivados</option>
          </select>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`h-11 px-4 rounded-sm border font-sans text-sm flex items-center gap-2 transition-colors ${
              filtersOpen || advancedFilterCount > 0
                ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                : 'border-border bg-surface text-text-secondary hover:text-text-primary hover:border-border-hover'
            }`}
          >
            <FilterIcon />
            Filtros
            {advancedFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent-gold text-[10px] font-bold text-brand-black">
                {advancedFilterCount}
              </span>
            )}
          </button>

          <Link href="/admin/productos/nuevo">
            <Button size="sm" leftIcon={<PlusIcon />}>Nuevo</Button>
          </Link>
        </div>
      </div>

      {/* ── Advanced filter panel ── */}
      {filtersOpen && (
        <div className="mb-4 p-4 rounded-lg border border-border bg-surface-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
          {/* SKU */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">SKU / Código</label>
            <input
              type="text"
              value={localSku}
              onChange={(e) => handleSkuChange(e.target.value)}
              placeholder="ABC-123"
              className={inputCls}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Color</label>
            <select
              value={colorId}
              onChange={(e) => pushParams({ colorId: e.target.value, page: '1' })}
              className={selectCls}
            >
              <option value="">Todos</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Talla */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Talla</label>
            <select
              value={sizeId}
              onChange={(e) => pushParams({ sizeId: e.target.value, page: '1' })}
              className={selectCls}
            >
              <option value="">Todas</option>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs text-text-secondary mb-1">Precio ($)</label>
            <div className="flex gap-1.5 items-center">
              <input
                type="number"
                value={localMinPrice}
                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                placeholder="Min"
                min={0}
                className={inputCls}
              />
              <span className="text-text-secondary text-xs shrink-0">—</span>
              <input
                type="number"
                value={localMaxPrice}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                placeholder="Max"
                min={0}
                className={inputCls}
              />
            </div>
          </div>

          {/* Stock range */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs text-text-secondary mb-1">Stock</label>
            <div className="flex gap-1.5 items-center">
              <input
                type="number"
                value={localMinStock}
                onChange={(e) => handleStockChange('minStock', e.target.value)}
                placeholder="Min"
                min={0}
                className={inputCls}
              />
              <span className="text-text-secondary text-xs shrink-0">—</span>
              <input
                type="number"
                value={localMaxStock}
                onChange={(e) => handleStockChange('maxStock', e.target.value)}
                placeholder="Max"
                min={0}
                className={inputCls}
              />
            </div>
          </div>

          {/* Clear */}
          <div className="flex items-end">
            <button
              onClick={clearAdvancedFilters}
              className="h-9 px-3 text-xs text-text-secondary hover:text-error transition-colors font-sans"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* ── Category / Collection chips ── */}
      {(categoryId && categoryName) || (collectionId && collectionName) ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {categoryId && categoryName && (
            <>
              <span className="text-xs text-text-secondary">Categoría:</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                {categoryName}
                <button
                  onClick={() => pushParams({ categoryId: '', categoryName: '', page: '1' })}
                  aria-label="Quitar filtro de categoría"
                  className="hover:text-accent-gold/60"
                >
                  <XIcon />
                </button>
              </span>
            </>
          )}
          {collectionId && collectionName && (
            <>
              <span className="text-xs text-text-secondary">Colección:</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                {collectionName}
                <button
                  onClick={() => pushParams({ collectionId: '', collectionName: '', page: '1' })}
                  aria-label="Quitar filtro de colección"
                  className="hover:text-accent-gold/60"
                >
                  <XIcon />
                </button>
              </span>
            </>
          )}
        </div>
      ) : null}

      {/* ── Table ── */}
      {rows.length === 0 ? (
        <div className="border border-border rounded-xl p-12 text-center bg-surface">
          <p className="font-sans text-sm text-text-secondary">
            {search || sku || colorId || sizeId || minPrice || maxPrice || minStock || maxStock || categoryId || collectionId
              ? 'Sin resultados para los filtros aplicados.'
              : 'Sin productos todavía.'}
          </p>
          <Link href="/admin/productos/nuevo" className="inline-block mt-3">
            <Button size="sm" variant="secondary">Crear primer producto</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
          <table className="w-full min-w-[700px] text-sm" role="grid">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider w-16">Imagen</th>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Producto</th>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Precio</th>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Stock</th>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const { label, variant } = productStatus(row)
                const isActing = pendingId === row.id
                const isPublished = row.isActive && row.publishedAt && new Date(row.publishedAt) <= new Date()

                return (
                  <tr key={row.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-9 rounded overflow-hidden bg-surface-2 border border-border shrink-0">
                        {row.primaryImageUrl ? (
                          <Image src={row.primaryImageUrl} alt={row.name} fill sizes="36px" className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                              <circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                              <path d="M1 11l4-3 3 2 3-3 4 3" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-sans text-sm font-medium text-text-primary">{row.name}</span>
                        <span className="font-sans text-xs text-text-secondary">{row.categoryName ?? '—'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={variant} size="sm">{label}</Badge>
                    </td>

                    <td className="px-4 py-3 font-sans text-sm text-text-primary">
                      ${row.basePrice.toFixed(2)}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`font-sans text-sm ${row.totalStock === 0 ? 'text-error' : row.totalStock <= 5 ? 'text-warning' : 'text-text-primary'}`}>
                        {row.totalStock}
                      </span>
                      {row.variantCount > 0 && (
                        <span className="font-sans text-xs text-text-secondary ml-1">({row.variantCount}v)</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Link href={`/admin/productos/${row.id}`}>
                          <button className="px-2.5 py-1 rounded text-xs font-sans border border-border hover:border-border-hover text-text-primary transition-colors">
                            Editar
                          </button>
                        </Link>

                        {row.isActive ? (
                          isPublished ? (
                            <button
                              onClick={() => handleAction(row.id, () => unpublishProductAction(row.id))}
                              disabled={isActing}
                              className="px-2.5 py-1 rounded text-xs font-sans border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                            >
                              Despublicar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(row.id, () => publishProductAction(row.id))}
                              disabled={isActing}
                              className="px-2.5 py-1 rounded text-xs font-sans border border-accent-gold hover:bg-accent-gold/10 text-accent-gold transition-colors disabled:opacity-50"
                            >
                              Publicar
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleAction(row.id, () => restoreProductAction(row.id))}
                            disabled={isActing}
                            className="px-2.5 py-1 rounded text-xs font-sans border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                          >
                            Restaurar
                          </button>
                        )}

                        <button
                          onClick={() => handleDuplicate(row.id)}
                          disabled={isActing}
                          className="px-2.5 py-1 rounded text-xs font-sans border border-border hover:border-border-hover text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                        >
                          Duplicar
                        </button>

                        {row.isActive && (
                          <button
                            onClick={() => setArchiveTarget(row)}
                            disabled={isActing}
                            className="px-2.5 py-1 rounded text-xs font-sans border border-error/30 hover:border-error text-error/70 hover:text-error transition-colors disabled:opacity-50"
                          >
                            Archivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => pushParams({ page: String(p) })}
          />
        </div>
      )}

      {/* Archive confirmation modal */}
      <Modal isOpen={!!archiveTarget} onClose={() => setArchiveTarget(null)} title="Archivar producto" size="sm">
        <div className="space-y-4">
          <p className="font-sans text-sm text-text-primary">
            ¿Archivar <strong>{archiveTarget?.name}</strong>? El producto dejará de ser visible en la tienda.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setArchiveTarget(null)}>Cancelar</Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isPending}
              onClick={() => {
                if (!archiveTarget) return
                const target = archiveTarget
                setArchiveTarget(null)
                handleAction(target.id, () => archiveProductAction(target.id))
              }}
            >
              Archivar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
