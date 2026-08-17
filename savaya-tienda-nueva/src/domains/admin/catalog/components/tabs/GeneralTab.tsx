'use client'

import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Toggle } from '@/shared/ui/Toggle'
import { slugify } from '@/shared/lib/slugify'
import type { CategoryOption, CollectionOption } from '../../types'

export type GeneralTabState = {
  name: string
  slug: string
  description: string
  categoryId: string
  collectionIds: string[]
  gender: 'women' | 'men' | 'unisex'
  productType: string
  basePrice: string
  compareAtPrice: string
  isFeatured: boolean
  isNew: boolean
  isActive: boolean
  tags: string
}

type Props = {
  state: GeneralTabState
  categories: CategoryOption[]
  collections: CollectionOption[]
  onChange: (patch: Partial<GeneralTabState>) => void
}

export function GeneralTab({ state, categories, collections, onChange }: Props) {
  function handleNameChange(name: string) {
    onChange({ name, slug: slugify(name) })
  }

  function toggleCollection(id: string) {
    const next = state.collectionIds.includes(id)
      ? state.collectionIds.filter((c) => c !== id)
      : [...state.collectionIds, id]
    onChange({ collectionIds: next })
  }

  return (
    <div className="space-y-6 py-2">
      {/* Name + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          value={state.name}
          onChange={(e) => handleNameChange(e.target.value)}
          isRequired
          placeholder="Ej. Sandalia Punta Fina"
        />
        <Input
          label="Slug (URL)"
          value={state.slug}
          onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
          hint="Se usa en la URL: /producto/este-slug"
          isRequired
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="font-sans text-sm font-medium text-text-primary">Descripción</label>
        <textarea
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={4}
          placeholder="Descripción del producto..."
          className="w-full rounded-sm border border-border bg-surface px-4 py-3 font-sans text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1 resize-y"
        />
      </div>

      {/* Category + Gender */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Categoría"
          value={state.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
        >
          <option value="">Sin categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.parentId ? '↳ ' : ''}{cat.name}
            </option>
          ))}
        </Select>

        <Select
          label="Género"
          value={state.gender}
          onChange={(e) => onChange({ gender: e.target.value as GeneralTabState['gender'] })}
        >
          <option value="women">Mujer</option>
          <option value="men">Hombre</option>
          <option value="unisex">Unisex</option>
        </Select>

        <Input
          label="Tipo de producto"
          value={state.productType}
          onChange={(e) => onChange({ productType: e.target.value })}
          placeholder="Ej. shoes, bags"
        />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Precio base (USD)"
          type="number"
          min="0"
          step="0.01"
          value={state.basePrice}
          onChange={(e) => onChange({ basePrice: e.target.value })}
          isRequired
          leftAddon={<span className="text-sm font-medium">$</span>}
        />
        <Input
          label="Precio tachado (USD)"
          type="number"
          min="0"
          step="0.01"
          value={state.compareAtPrice}
          onChange={(e) => onChange({ compareAtPrice: e.target.value })}
          hint="Se muestra tachado para indicar descuento"
          leftAddon={<span className="text-sm font-medium">$</span>}
        />
      </div>

      {/* Tags */}
      <Input
        label="Tags"
        value={state.tags}
        onChange={(e) => onChange({ tags: e.target.value })}
        hint="Separados por coma. Ej: sandalia, cuero, verano"
        placeholder="sandalia, cuero, verano"
      />

      {/* Collections */}
      {collections.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-sans text-sm font-medium text-text-primary">Colecciones</span>
          <div className="flex flex-wrap gap-2">
            {collections.map((col) => {
              const selected = state.collectionIds.includes(col.id)
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => toggleCollection(col.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-sans font-medium border transition-colors duration-150 ${
                    selected
                      ? 'bg-accent-gold text-text-primary-inverse border-accent-gold'
                      : 'bg-surface text-text-primary border-border hover:border-border-hover'
                  }`}
                >
                  {col.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Flags */}
      <div className="flex flex-wrap gap-6 pt-2">
        <Toggle
          label="Producto activo"
          checked={state.isActive}
          onChange={(v) => onChange({ isActive: v })}
        />
        <Toggle
          label="Destacado"
          checked={state.isFeatured}
          onChange={(v) => onChange({ isFeatured: v })}
        />
        <Toggle
          label="Nuevo"
          checked={state.isNew}
          onChange={(v) => onChange({ isNew: v })}
        />
      </div>
    </div>
  )
}
