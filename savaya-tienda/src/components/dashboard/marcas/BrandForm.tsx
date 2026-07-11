'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveBrand } from '@/app/dashboard/marcas/actions'
import type { Brand } from '@/lib/types'

const INPUT =
  'w-full border border-gray-light rounded px-3 py-2.5 text-sm font-body focus:border-black focus:outline-none transition-colors'
const LABEL = 'block text-sm font-heading font-semibold text-black mb-1.5'
const ERROR = 'text-xs text-sale font-body mt-1'
const CARD = 'bg-white rounded border border-gray-light p-5'

interface BrandFormProps {
  brand?: Brand
}

export default function BrandForm({ brand }: BrandFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!brand

  const [name, setName] = useState(brand?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url ?? '')
  const [isActive, setIsActive] = useState(brand?.is_active ?? true)
  const [order, setOrder] = useState(brand?.order ?? 0)
  const [serverError, setServerError] = useState('')
  const [nameError, setNameError] = useState('')

  function validate() {
    if (!name.trim() || name.trim().length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres')
      return false
    }
    setNameError('')
    return true
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      const result = await saveBrand(
        { name: name.trim(), logo_url: logoUrl || null, is_active: isActive, order },
        brand?.id,
      )
      if ('error' in result) {
        setServerError(result.error)
        return
      }
      router.push('/dashboard/marcas')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-heading font-bold text-black">
          {isEditing ? 'Editar marca' : 'Nueva marca'}
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/marcas')}
            className="text-sm font-body text-gray-text hover:text-black transition-colors px-4 py-2.5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-5 py-2.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isPending ? 'Guardando…' : 'Guardar marca'}
          </button>
        </div>
      </div>

      {serverError && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded px-4 py-3 text-sm text-sale font-body">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-4">
              Información de la marca
            </h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Nombre *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={INPUT}
                  placeholder="Ej: Nike, Zara, Adidas…"
                />
                {nameError && <p className={ERROR}>{nameError}</p>}
                {!isEditing && name.trim().length >= 2 && (
                  <p className="text-[11px] text-gray-text font-body mt-1">
                    URL: /marcas/{name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
                  </p>
                )}
              </div>

              <div>
                <label className={LABEL}>
                  URL del logo{' '}
                  <span className="text-gray-text font-body font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className={INPUT}
                  placeholder="https://res.cloudinary.com/…"
                />
                <p className="text-[11px] text-gray-text font-body mt-1">
                  URL de Cloudinary. Si no hay logo, se muestra solo el nombre.
                </p>
              </div>

              <div>
                <label className={LABEL}>Orden de aparición en navbar</label>
                <input
                  type="number"
                  min={0}
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className={INPUT}
                  placeholder="0"
                />
                <p className="text-[11px] text-gray-text font-body mt-1">
                  Número menor = aparece primero en el menú de marcas.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className={CARD}>
            <h2 className="text-sm font-heading font-semibold text-black mb-4">Estado</h2>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-light accent-black cursor-pointer"
              />
              <div>
                <p className="text-sm font-body font-medium text-black group-hover:text-accent transition-colors">
                  Marca activa
                </p>
                <p className="text-[11px] text-gray-text font-body">
                  Visible en el menú de MARCAS de la tienda
                </p>
              </div>
            </label>
          </div>

          {isEditing && brand?.logo_url && (
            <div className={CARD}>
              <h2 className="text-sm font-heading font-semibold text-black mb-3">
                Logo actual
              </h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="max-h-20 object-contain"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 py-4 border-t border-gray-light">
        <button
          type="button"
          onClick={() => router.push('/dashboard/marcas')}
          className="text-sm font-body text-gray-text hover:text-black transition-colors px-4 py-2.5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-6 py-2.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isPending && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isPending ? 'Guardando…' : 'Guardar marca'}
        </button>
      </div>
    </form>
  )
}
