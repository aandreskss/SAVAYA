'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toggleBrandStatus, deleteBrand } from './actions'
import type { Brand } from '@/lib/types'

type BrandWithCount = Brand & { productCount: number }

export default function BrandsListClient({ brands }: { brands: BrandWithCount[] }) {
  const [list, setList] = useState(brands)
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<Record<string, string>>({})

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleBrandStatus(id, !current)
      setList((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_active: !current } : b))
      )
    })
  }

  function handleDelete(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }
    startTransition(async () => {
      const result = await deleteBrand(id)
      if (result.error) {
        setDeleteError((prev) => ({ ...prev, [id]: result.error! }))
        setConfirmDelete(null)
        return
      }
      setList((prev) => prev.filter((b) => b.id !== id))
      setConfirmDelete(null)
    })
  }

  if (list.length === 0) {
    return (
      <div className="bg-white border border-gray-light rounded p-12 text-center">
        <p className="text-gray-text font-body text-sm mb-4">
          No hay marcas registradas todavía.
        </p>
        <Link
          href="/dashboard/marcas/nueva"
          className="inline-block bg-black text-white font-heading font-semibold text-sm px-5 py-2.5 rounded hover:bg-accent transition-colors"
        >
          Crear primera marca
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-light rounded divide-y divide-gray-light">
      {list.map((brand) => (
        <div
          key={brand.id}
          className="flex items-center gap-4 px-5 py-4"
        >
          {/* Logo */}
          <div className="w-12 h-12 shrink-0 border border-gray-light rounded bg-gray-bg flex items-center justify-center overflow-hidden">
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-xs font-heading font-bold text-gray-text">
                {brand.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-sm text-black truncate">
                {brand.name}
              </span>
              <span
                className={[
                  'shrink-0 text-[10px] font-heading font-bold px-1.5 py-0.5 rounded uppercase',
                  brand.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-bg text-gray-text',
                ].join(' ')}
              >
                {brand.is_active ? 'Activa' : 'Oculta'}
              </span>
            </div>
            <p className="text-[11px] text-gray-text font-body mt-0.5">
              /marcas/{brand.slug} · {brand.productCount} producto{brand.productCount !== 1 ? 's' : ''}
            </p>
            {deleteError[brand.id] && (
              <p className="text-[11px] text-sale font-body mt-1">{deleteError[brand.id]}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleToggle(brand.id, brand.is_active)}
              disabled={isPending}
              className="text-xs font-heading text-gray-text hover:text-black transition-colors px-3 py-1.5 border border-gray-light rounded disabled:opacity-40"
            >
              {brand.is_active ? 'Ocultar' : 'Activar'}
            </button>

            <Link
              href={`/dashboard/marcas/${brand.id}/editar`}
              className="text-xs font-heading text-gray-text hover:text-black transition-colors px-3 py-1.5 border border-gray-light rounded"
            >
              Editar
            </Link>

            <button
              type="button"
              onClick={() => handleDelete(brand.id)}
              disabled={isPending}
              className={[
                'text-xs font-heading transition-colors px-3 py-1.5 border rounded disabled:opacity-40',
                confirmDelete === brand.id
                  ? 'bg-sale text-white border-sale'
                  : 'text-gray-text hover:text-sale border-gray-light hover:border-sale',
              ].join(' ')}
            >
              {confirmDelete === brand.id ? '¿Confirmar?' : 'Eliminar'}
            </button>

            {confirmDelete === brand.id && (
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="text-xs font-heading text-gray-text hover:text-black transition-colors"
              >
                No
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
