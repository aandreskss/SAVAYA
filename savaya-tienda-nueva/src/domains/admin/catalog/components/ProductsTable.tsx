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
import type { AdminProductRow } from '../types'

type Props = {
  rows: AdminProductRow[]
  total: number
  page: number
  limit: number
  search: string
  status: string
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

export function ProductsTable({ rows, total, page, limit, search, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<AdminProductRow | null>(null)
  const [localSearch, setLocalSearch] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.ceil(total / limit)

  function pushParams(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    const all = { search: localSearch, status, page: String(page), ...params }
    Object.entries(all).forEach(([k, v]) => {
      if (v && v !== '' && v !== '1' || (k === 'page' && v && v !== '1')) {
        if (v && v !== '') sp.set(k, v)
      }
    })
    router.push(`/admin/productos?${sp.toString()}`)
  }

  function handleSearchChange(value: string) {
    setLocalSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushParams({ search: value, page: '1' })
    }, 350)
  }

  function handleStatusChange(s: string) {
    pushParams({ status: s, page: '1' })
  }

  function handlePageChange(p: number) {
    pushParams({ page: String(p) })
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar productos..."
            className="h-11 w-full pl-10 pr-4 rounded-sm border border-border bg-surface font-sans text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
          />
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-11 px-4 pr-8 appearance-none rounded-sm border border-border bg-surface font-sans text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
          >
            <option value="">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
            <option value="archived">Archivados</option>
          </select>

          <Link href="/admin/productos/nuevo">
            <Button size="sm" leftIcon={<PlusIcon />}>
              Nuevo
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="border border-border rounded-xl p-12 text-center bg-surface">
          <p className="font-sans text-sm text-text-secondary">
            {search ? `Sin resultados para "${search}"` : 'Sin productos todavía.'}
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
                          <Image
                            src={row.primaryImageUrl}
                            alt={row.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
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
                          <button className="px-2.5 py-1 rounded text-xs font-sans border border-border hover:border-border-hover text-text-primary hover:text-text-primary transition-colors">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Archive confirmation modal */}
      <Modal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title="Archivar producto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="font-sans text-sm text-text-primary">
            ¿Archivar <strong>{archiveTarget?.name}</strong>? El producto dejará de ser visible en la tienda.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setArchiveTarget(null)}>
              Cancelar
            </Button>
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
