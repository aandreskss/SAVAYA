'use client'

import { useState, useTransition } from 'react'
import { toggleCategory } from './actions'

// Colecciones especiales: rutas que existen aunque no tengan fila en categories
const SPECIAL_ITEMS = [
  { key: 'nuevas-colecciones', label: 'Nuevas Colecciones', desc: 'Catálogo /nuevas-colecciones' },
  { key: 'descuentos', label: 'Descuentos', desc: 'Catálogo /descuentos' },
  { key: 'remates', label: 'Remates', desc: 'Catálogo /remates' },
]

interface CategoryRow {
  key: string
  is_visible: boolean
}

interface TopCategory {
  id: string
  name: string
  slug: string
}

interface Props {
  categories: CategoryRow[]
  topCategories: TopCategory[]
}

export default function CategoriasForm({ categories, topCategories }: Props) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(categories.map((c) => [c.key, c.is_visible]))
  )
  const [isPending, startTransition] = useTransition()
  const [lastToggled, setLastToggled] = useState<string | null>(null)

  function handleToggle(key: string) {
    const newVal = !(state[key] ?? true)
    setState((prev) => ({ ...prev, [key]: newVal }))
    setLastToggled(key)
    startTransition(async () => {
      await toggleCategory(key, newVal)
    })
  }

  function ToggleRow({ itemKey, label, desc }: { itemKey: string; label: string; desc: string }) {
    const isVisible = state[itemKey] ?? true
    const isUpdating = isPending && lastToggled === itemKey
    return (
      <div className="flex items-center justify-between p-4 bg-white border border-gray-light rounded-lg">
        <div>
          <p className={`text-sm font-heading font-semibold ${isVisible ? 'text-black' : 'text-gray-text line-through'}`}>
            {label}
          </p>
          <p className="text-xs text-gray-text mt-0.5">{desc}</p>
        </div>
        <button
          type="button"
          onClick={() => handleToggle(itemKey)}
          disabled={isUpdating}
          aria-label={`${isVisible ? 'Desactivar' : 'Activar'} ${label}`}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${
            isVisible ? 'bg-black' : 'bg-gray-light'
          } ${isUpdating ? 'opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isVisible ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="p-4 bg-gold/5 border border-gold/20 rounded-lg">
        <p className="text-xs font-heading font-semibold text-black mb-1">¿Cómo funciona?</p>
        <p className="text-xs text-gray-text">
          Al desactivar una categoría, desaparece del navbar, menú móvil, footer y sección
          «Compra por categoría» de la homepage.
        </p>
      </div>

      {/* Dynamic top-level categories from DB */}
      {topCategories.length > 0 && (
        <div>
          <p className="font-heading font-bold text-[11px] uppercase tracking-widest text-gray-text mb-3">
            Categorías principales
          </p>
          <div className="space-y-2">
            {topCategories.map(({ slug, name }) => (
              <ToggleRow
                key={slug}
                itemKey={slug}
                label={name}
                desc={`Categoría /${slug}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Special collections (hardcoded routes, not in categories table) */}
      <div>
        <p className="font-heading font-bold text-[11px] uppercase tracking-widest text-gray-text mb-3">
          Colecciones especiales
        </p>
        <div className="space-y-2">
          {SPECIAL_ITEMS.map(({ key, label, desc }) => (
            <ToggleRow key={key} itemKey={key} label={label} desc={desc} />
          ))}
        </div>
      </div>
    </div>
  )
}
