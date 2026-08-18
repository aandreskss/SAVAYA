'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/shared/ui/Input'
import { Toggle } from '@/shared/ui/Toggle'
import { Button } from '@/shared/ui/Button'
import { toast } from '@/shared/ui'
import { slugify } from '@/shared/lib/slugify'
import {
  saveCollectionAction,
  setCollectionProductsAction,
  searchProductsForCollectionAction,
} from '../actions'
import type { CollectionProductSummary } from '../repository'

type CollectionData = {
  id?: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  isFeatured: boolean
  startsAt: Date | null
  endsAt: Date | null
}

type Props = {
  collection?: CollectionData
  initialProducts?: CollectionProductSummary[]
}

function toDatetimeLocal(d: Date | null): string {
  if (!d) return ''
  return d.toISOString().slice(0, 16)
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Products panel (only shown for existing collections)
// ---------------------------------------------------------------------------

function ProductsPanel({
  collectionId,
  collectionSlug,
  products,
}: {
  collectionId: string
  collectionSlug: string
  products: CollectionProductSummary[]
}) {
  const [selectedProducts, setSelectedProducts] = useState<CollectionProductSummary[]>(products)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CollectionProductSummary[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, startSaveTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      const result = await searchProductsForCollectionAction(q)
      setIsSearching(false)
      if (result.success) {
        setSearchResults(result.data.filter((p) => !selectedProducts.some((s) => s.id === p.id)))
      }
    }, 300)
  }, [selectedProducts])

  function addProduct(p: CollectionProductSummary) {
    setSelectedProducts((prev) => [...prev, p])
    setSearchResults((prev) => prev.filter((r) => r.id !== p.id))
  }

  function removeProduct(id: string) {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function handleSaveProducts() {
    startSaveTransition(async () => {
      const result = await setCollectionProductsAction(
        collectionId,
        selectedProducts.map((p) => p.id),
      )
      if (result.success) {
        toast.success('Productos actualizados')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg uppercase tracking-wide text-text-primary">
          Productos ({selectedProducts.length})
        </h2>
        <div className="flex items-center gap-2">
          <a
            href={`/coleccion/${collectionSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-accent-gold underline underline-offset-2 hover:opacity-80"
          >
            Ver página →
          </a>
          <Button
            onClick={handleSaveProducts}
            isLoading={isSaving}
            size="sm"
            variant="primary"
          >
            Guardar productos
          </Button>
        </div>
      </div>

      {/* Search to add */}
      <div className="relative">
        <Input
          label="Buscar producto para agregar"
          placeholder="Nombre del producto…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {(searchResults.length > 0 || isSearching) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-md z-10 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="px-4 py-3 font-sans text-sm text-text-secondary">Buscando…</div>
            ) : (
              searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    addProduct(p)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors text-left"
                >
                  {p.primaryImageUrl && (
                    <img
                      src={p.primaryImageUrl}
                      alt=""
                      className="w-9 h-9 rounded object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-sans text-sm text-text-primary truncate">{p.name}</p>
                    <p className="font-sans text-xs text-text-secondary">${p.basePrice}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-accent-gold">
                    <PlusIcon />
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected products list */}
      {selectedProducts.length === 0 ? (
        <p className="font-sans text-sm text-text-secondary py-2">
          No hay productos en esta colección. Usa el buscador para agregar.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {selectedProducts.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              {p.primaryImageUrl && (
                <img
                  src={p.primaryImageUrl}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm font-medium text-text-primary truncate">{p.name}</p>
                <p className="font-sans text-xs text-text-secondary">${p.basePrice}</p>
              </div>
              <button
                type="button"
                onClick={() => removeProduct(p.id)}
                aria-label={`Quitar ${p.name}`}
                className="shrink-0 p-1.5 rounded text-text-secondary hover:text-error transition-colors"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CollectionEditor
// ---------------------------------------------------------------------------

export function CollectionEditor({ collection, initialProducts = [] }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(collection?.name ?? '')
  const [slug, setSlug] = useState(collection?.slug ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [imageUrl, setImageUrl] = useState(collection?.imageUrl ?? '')
  const [isActive, setIsActive] = useState(collection?.isActive ?? true)
  const [isFeatured, setIsFeatured] = useState(collection?.isFeatured ?? false)
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(collection?.startsAt ?? null))
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(collection?.endsAt ?? null))

  function handleNameChange(n: string) {
    setName(n)
    if (!collection) setSlug(slugify(n))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveCollectionAction({
        id: collection?.id,
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive,
        isFeatured,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(collection ? 'Colección actualizada' : 'Colección creada')
      if (!collection) {
        router.push(`/admin/productos/colecciones/${result.data?.id}`)
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl uppercase tracking-wide">
          {collection ? 'Editar colección' : 'Nueva colección'}
        </h1>
        <Button onClick={handleSave} isLoading={isPending} size="md">
          {collection ? 'Guardar cambios' : 'Crear colección'}
        </Button>
      </div>

      {/* Metadata form */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            isRequired
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            isRequired
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-sans text-sm font-medium text-text-primary">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-sm border border-border bg-surface px-4 py-3 font-sans text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1 resize-y"
          />
        </div>

        <Input
          label="URL de imagen"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-sans text-sm font-medium text-text-primary block mb-1.5">
              Fecha de inicio (opcional)
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="h-11 w-full rounded-sm border border-border bg-surface px-4 font-sans text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
            />
          </div>
          <div>
            <label className="font-sans text-sm font-medium text-text-primary block mb-1.5">
              Fecha de fin (opcional)
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="h-11 w-full rounded-sm border border-border bg-surface px-4 font-sans text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <Toggle label="Colección activa" checked={isActive} onChange={setIsActive} />
          <Toggle label="Destacada en home" checked={isFeatured} onChange={setIsFeatured} />
        </div>

        {/* Collection URL hint */}
        {collection?.slug && (
          <div className="pt-1">
            <p className="font-sans text-xs text-text-secondary">
              URL de la colección:{' '}
              <a
                href={`/coleccion/${collection.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-gold underline underline-offset-2 hover:opacity-80"
              >
                /coleccion/{collection.slug}
              </a>
              {' '}— úsala en banners y CTAs
            </p>
          </div>
        )}
      </div>

      {/* Products panel — only for existing collections */}
      {collection?.id && (
        <ProductsPanel
          collectionId={collection.id}
          collectionSlug={collection.slug}
          products={initialProducts}
        />
      )}

      {!collection && (
        <p className="font-sans text-sm text-text-secondary text-center">
          Crea la colección primero para poder agregar productos.
        </p>
      )}
    </div>
  )
}
