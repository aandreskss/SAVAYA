'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn, slugify, formatPrice } from '@/lib/utils'
import { cloudinaryCoverLoader } from '@/lib/cloudinary'
import {
  saveCollection,
  saveCollectionProducts,
  type TagStyle,
  type CollectionProductRow,
} from '@/app/dashboard/colecciones/actions'
import type { Product } from '@/lib/types'

interface SelectedProduct {
  productId: string
  name: string
  slug: string
  images: string[]
  base_price: number
  sale_price: number | null
  customTag: string
  tagStyle: TagStyle
  displayOrder: number
}

const TAG_STYLES: { value: TagStyle; label: string; dotClass: string; previewClass: string }[] = [
  { value: 'sale',   label: 'Rojo',    dotClass: 'bg-sale',   previewClass: 'bg-sale text-white' },
  { value: 'gold',   label: 'Dorado',  dotClass: 'bg-gold',   previewClass: 'bg-gold text-white' },
  { value: 'black',  label: 'Negro',   dotClass: 'bg-black',  previewClass: 'bg-black text-white' },
  { value: 'accent', label: 'Azul',    dotClass: 'bg-accent', previewClass: 'bg-accent text-white' },
  { value: 'white',  label: 'Blanco',  dotClass: 'bg-white border border-gray-300', previewClass: 'bg-white text-black border border-gray-200' },
]

type NavGenderValue = '' | 'women' | 'men' | 'kids' | 'unisex'

const NAV_GENDER_OPTIONS: { value: NavGenderValue; label: string }[] = [
  { value: '',       label: 'No mostrar en navbar' },
  { value: 'women',  label: 'Mujer' },
  { value: 'men',    label: 'Hombre' },
  { value: 'kids',   label: 'Niños' },
  { value: 'unisex', label: 'Unisex (Mujer y Hombre)' },
]

interface Props {
  allProducts: Pick<Product, 'id' | 'name' | 'slug' | 'images' | 'base_price' | 'sale_price'>[]
  initial?: {
    id: string
    name: string
    slug: string
    description: string | null
    is_active: boolean
    show_on_home: boolean
    nav_gender: string | null
    products: CollectionProductRow[]
  }
}

export default function CollectionEditor({ allProducts, initial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [showOnHome, setShowOnHome] = useState(initial?.show_on_home ?? false)
  const [navGender, setNavGender] = useState<NavGenderValue>((initial?.nav_gender as NavGenderValue) ?? '')
  const slugManual = useRef(!!initial?.slug)

  const [selected, setSelected] = useState<SelectedProduct[]>(
    () =>
      (initial?.products ?? [])
        .filter((p) => p.products)
        .map((p) => ({
          productId: p.product_id,
          name: p.products!.name,
          slug: p.products!.slug,
          images: p.products!.images,
          base_price: p.products!.base_price,
          sale_price: p.products!.sale_price,
          customTag: p.custom_tag ?? '',
          tagStyle: (p.tag_style as TagStyle) ?? 'sale',
          displayOrder: p.display_order,
        }))
  )
  const [search, setSearch] = useState('')

  function handleNameChange(v: string) {
    setName(v)
    if (!slugManual.current) setSlug(slugify(v))
  }

  const selectedIds = new Set(selected.map((p) => p.productId))
  const searchResults = search
    ? allProducts
        .filter((p) => !selectedIds.has(p.id) && p.name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 15)
    : []

  function addProduct(p: (typeof allProducts)[number]) {
    setSelected((prev) => [
      ...prev,
      {
        productId: p.id,
        name: p.name,
        slug: p.slug,
        images: p.images,
        base_price: p.base_price,
        sale_price: p.sale_price,
        customTag: '',
        tagStyle: 'sale',
        displayOrder: prev.length,
      },
    ])
    setSearch('')
  }

  function removeProduct(id: string) {
    setSelected((prev) =>
      prev
        .filter((p) => p.productId !== id)
        .map((p, i) => ({ ...p, displayOrder: i }))
    )
  }

  function updateProduct(id: string, patch: Partial<SelectedProduct>) {
    setSelected((prev) => prev.map((p) => (p.productId === id ? { ...p, ...patch } : p)))
  }

  function move(id: string, dir: 'up' | 'down') {
    setSelected((prev) => {
      const idx = prev.findIndex((p) => p.productId === id)
      if (idx === -1) return prev
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next.map((p, i) => ({ ...p, displayOrder: i }))
    })
  }

  function handleSave() {
    if (!name.trim() || !slug.trim()) {
      setError('Nombre y slug son requeridos')
      return
    }
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      if (initial?.id) fd.append('id', initial.id)
      fd.append('name', name)
      fd.append('slug', slug)
      fd.append('description', description)
      fd.append('is_active', String(isActive))
      fd.append('show_on_home', String(showOnHome))
      fd.append('nav_gender', navGender)

      const res = await saveCollection(fd)
      if (res.error) { setError(res.error); return }

      const collectionId = res.id ?? initial?.id
      if (!collectionId) { setError('No se pudo obtener el ID'); return }

      const prodsRes = await saveCollectionProducts(collectionId, selected)
      if (prodsRes.error) { setError(prodsRes.error); return }

      router.push('/dashboard/colecciones')
      router.refresh()
    })
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ── Metadata ── */}
      <div className="bg-white border border-gray-light rounded-lg p-6 space-y-5">
        <h2 className="font-heading font-semibold text-sm text-black">Información de la colección</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-heading font-semibold text-black/70 block mb-1.5">Nombre *</label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Remates de Verano"
              className="w-full border border-gray-light rounded px-3 py-2 text-sm font-body focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="text-xs font-heading font-semibold text-black/70 block mb-1.5">Slug (URL)</label>
            <div className="flex items-center border border-gray-light rounded overflow-hidden focus-within:border-black">
              <span className="px-3 py-2 text-xs text-gray-text bg-gray-bg font-body border-r border-gray-light whitespace-nowrap">/coleccion/</span>
              <input
                value={slug}
                onChange={(e) => { slugManual.current = true; setSlug(e.target.value) }}
                placeholder="remates-verano"
                className="flex-1 px-3 py-2 text-sm font-body focus:outline-none min-w-0"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-heading font-semibold text-black/70 block mb-1.5">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Descripción breve de la colección (opcional)"
            className="w-full border border-gray-light rounded px-3 py-2 text-sm font-body focus:outline-none focus:border-black resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
            <span className="text-sm font-body">Activa (visible en tienda)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={showOnHome} onChange={(e) => setShowOnHome(e.target.checked)} className="rounded" />
            <span className="text-sm font-body">
              Mostrar en homepage
              <span className="text-xs text-gray-text ml-1">(solo una colección a la vez)</span>
            </span>
          </label>
        </div>

        {/* Nav gender selector */}
        <div>
          <label className="text-xs font-heading font-semibold text-black/70 block mb-2">
            Mostrar en el navbar
          </label>
          <div className="flex flex-wrap gap-2">
            {NAV_GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNavGender(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded border text-xs font-heading font-semibold transition-colors',
                  navGender === opt.value
                    ? 'bg-black text-white border-black'
                    : 'border-gray-light text-gray-text hover:border-black hover:text-black'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {navGender && (
            <p className="text-[11px] text-gray-text font-body mt-1.5">
              Aparecerá en el menú de{' '}
              <span className="font-semibold text-black">
                {navGender === 'unisex' ? 'Mujer y Hombre' : NAV_GENDER_OPTIONS.find(o => o.value === navGender)?.label}
              </span>{' '}
              como enlace de colección especial.
            </p>
          )}
        </div>
      </div>

      {/* ── Products ── */}
      <div className="bg-white border border-gray-light rounded-lg p-6">
        <h2 className="font-heading font-semibold text-sm text-black mb-1">Productos de la colección</h2>
        <p className="text-xs text-gray-text font-body mb-4">
          Agrega los productos y configura el tag promocional de cada uno.
        </p>

        {/* Search input */}
        <div className="relative mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto por nombre para agregar…"
            className="w-full border border-gray-light rounded px-3 py-2 text-sm font-body focus:outline-none focus:border-black"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-black text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {search && (
          <div className="mb-5 border border-gray-light rounded divide-y divide-gray-light max-h-60 overflow-y-auto shadow-sm">
            {searchResults.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-text font-body">Sin resultados</p>
            ) : (
              searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-bg text-left transition-colors"
                >
                  {p.images[0] && (
                    <div className="relative w-9 h-12 rounded overflow-hidden bg-gray-bg shrink-0">
                      <Image loader={cloudinaryCoverLoader} src={p.images[0]} alt={p.name} fill sizes="36px" className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body truncate">{p.name}</p>
                    <p className="text-xs text-gray-text">{formatPrice(p.sale_price ?? p.base_price)}</p>
                  </div>
                  <span className="text-xs font-heading font-semibold text-accent shrink-0">+ Agregar</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Selected products */}
        {selected.length === 0 ? (
          <div className="border border-dashed border-gray-light rounded py-10 text-center">
            <p className="text-sm text-gray-text font-body">Busca y agrega productos arriba</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selected.map((p, idx) => {
              const styleInfo = TAG_STYLES.find((s) => s.value === p.tagStyle) ?? TAG_STYLES[0]
              return (
                <div key={p.productId} className="flex items-start gap-3 p-3 border border-gray-light rounded">
                  {/* Thumbnail */}
                  {p.images[0] && (
                    <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-bg shrink-0">
                      <Image loader={cloudinaryCoverLoader} src={p.images[0]} alt={p.name} fill sizes="48px" className="object-cover" />
                    </div>
                  )}

                  {/* Info + tag config */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div>
                      <p className="text-sm font-body font-medium truncate">{p.name}</p>
                      <p className="text-xs text-gray-text">
                        {p.sale_price ? (
                          <>
                            <span className="text-sale font-semibold">{formatPrice(p.sale_price)}</span>
                            <span className="line-through ml-1">{formatPrice(p.base_price)}</span>
                          </>
                        ) : (
                          formatPrice(p.base_price)
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Tag text */}
                      <input
                        value={p.customTag}
                        onChange={(e) => updateProduct(p.productId, { customTag: e.target.value })}
                        placeholder="Tag (ej: -40%, ¡OFERTA!, EXCLUSIVO)"
                        className="border border-gray-light rounded px-2.5 py-1.5 text-xs font-body focus:outline-none focus:border-black min-w-40 flex-1"
                      />

                      {/* Color dots */}
                      <div className="flex items-center gap-1.5" title="Color del tag">
                        {TAG_STYLES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => updateProduct(p.productId, { tagStyle: s.value })}
                            title={s.label}
                            className={cn(
                              'w-4 h-4 rounded-full transition-transform',
                              s.dotClass,
                              p.tagStyle === s.value ? 'scale-125 ring-2 ring-black ring-offset-1' : 'opacity-60 hover:opacity-100'
                            )}
                          />
                        ))}
                      </div>

                      {/* Live preview */}
                      {p.customTag && (
                        <span className={cn('px-2.5 py-0.5 text-[11px] font-heading font-black uppercase rounded-sm', styleInfo.previewClass)}>
                          {p.customTag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order + delete */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => move(p.productId, 'up')}
                      disabled={idx === 0}
                      className="w-6 h-6 flex items-center justify-center rounded border border-gray-light text-xs disabled:opacity-25 hover:bg-gray-bg"
                    >↑</button>
                    <button
                      type="button"
                      onClick={() => move(p.productId, 'down')}
                      disabled={idx === selected.length - 1}
                      className="w-6 h-6 flex items-center justify-center rounded border border-gray-light text-xs disabled:opacity-25 hover:bg-gray-bg"
                    >↓</button>
                    <button
                      type="button"
                      onClick={() => removeProduct(p.productId)}
                      className="w-6 h-6 flex items-center justify-center rounded border border-gray-light text-sale hover:bg-red-50 text-base leading-none"
                    >×</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Save ── */}
      {error && <p className="text-sm text-sale font-body">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-5 py-2.5 rounded hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isPending && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isPending ? 'Guardando…' : 'Guardar colección'}
        </button>
        <button type="button" onClick={() => router.back()} className="text-sm font-body text-gray-text hover:text-black">
          Cancelar
        </button>
      </div>
    </div>
  )
}
