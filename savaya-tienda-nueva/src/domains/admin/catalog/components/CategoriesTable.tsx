'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/shared/ui/Badge'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui'
import { deleteCategoryAction } from '../actions'
import type { AdminCategoryRow } from '../types'

type Props = {
  rows: AdminCategoryRow[]
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function CategoriesTable({ rows }: Props) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<AdminCategoryRow | null>(null)

  function handleDelete(row: AdminCategoryRow) {
    if (row.productCount > 0) {
      toast.error(`Esta categoría tiene ${row.productCount} producto(s). Reasígnalos antes de eliminar.`)
      return
    }
    setDeleteTarget(row)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    startTransition(async () => {
      const result = await deleteCategoryAction(target.id)
      if (!result.success) toast.error(result.error ?? 'Error al eliminar')
      else toast.success('Categoría eliminada')
    })
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link href="/admin/productos/categorias/nuevo">
          <Button size="sm" leftIcon={<PlusIcon />}>Nueva categoría</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="border border-border rounded-xl p-12 text-center bg-surface">
          <p className="font-sans text-sm text-text-secondary">Sin categorías todavía.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-surface">
          <table className="w-full text-sm" role="grid">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Padre</th>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Productos</th>
                <th scope="col" className="px-4 py-3 text-left font-sans text-xs font-medium text-text-secondary uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-sans text-sm font-medium text-text-primary">
                        {row.parentId ? '↳ ' : ''}{row.name}
                      </span>
                      <div className="font-mono text-xs text-text-secondary mt-0.5">{row.slug}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-sans text-sm text-text-secondary">
                    {row.parentName ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={row.isActive ? 'success' : 'default'} size="sm">
                      {row.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-sans text-sm text-text-primary">{row.productCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/productos/categorias/${row.id}`}>
                        <button className="px-2.5 py-1 rounded text-xs font-sans border border-border hover:border-border-hover text-text-primary hover:text-text-primary transition-colors">
                          Editar
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(row)}
                        disabled={isPending}
                        className="px-2.5 py-1 rounded text-xs font-sans border border-error/30 hover:border-error text-error/70 hover:text-error transition-colors disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar categoría" size="sm">
        <div className="space-y-4">
          <p className="font-sans text-sm text-text-primary">
            ¿Eliminar la categoría <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" size="sm" isLoading={isPending} onClick={confirmDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
