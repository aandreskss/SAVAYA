'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { BottomSheet } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { Accordion } from '@/shared/ui'
import { Checkbox } from '@/shared/ui'
import { Input } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { PLPSearchParams } from '../search-params'
import { buildFilterUrl } from '../search-params'

export type FilterBottomSheetProps = {
  availableColors: { id: string; name: string; hex: string }[]
  availableSizes: { id: string; name: string }[]
  priceRange: { min: number; max: number }
  activeFilters: PLPSearchParams
  totalResults: number
}

export function FilterBottomSheet({
  availableColors,
  availableSizes,
  priceRange,
  activeFilters,
  totalResults,
}: FilterBottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Local draft state — only applied when user presses "Ver productos"
  const [draft, setDraft] = useState<PLPSearchParams>(activeFilters)

  function openSheet() {
    setDraft(activeFilters) // sync draft with current URL state
    setIsOpen(true)
  }

  function applyFilters() {
    const qs = buildFilterUrl(draft, { pagina: 1 })
    router.push(`${pathname}${qs}`, { scroll: false })
    setIsOpen(false)
  }

  function clearFilters() {
    setDraft({
      orden: 'destacados',
      pagina: 1,
    })
  }

  function toggleColor(colorId: string) {
    const current = draft.color?.split(',').filter(Boolean) ?? []
    const next = current.includes(colorId)
      ? current.filter((id) => id !== colorId)
      : [...current, colorId]
    setDraft((d) => ({ ...d, color: next.length > 0 ? next.join(',') : undefined }))
  }

  function toggleSize(sizeId: string) {
    const current = draft.talla?.split(',').filter(Boolean) ?? []
    const next = current.includes(sizeId)
      ? current.filter((id) => id !== sizeId)
      : [...current, sizeId]
    setDraft((d) => ({ ...d, talla: next.length > 0 ? next.join(',') : undefined }))
  }

  const activeFilterCount = [
    activeFilters.color,
    activeFilters.talla,
    activeFilters.precio_min !== undefined ? 'x' : undefined,
    activeFilters.precio_max !== undefined ? 'x' : undefined,
    activeFilters.disponible,
    activeFilters.nuevo,
    activeFilters.oferta,
  ].filter(Boolean).length

  const draftColorIds = draft.color?.split(',').filter(Boolean) ?? []
  const draftSizeIds = draft.talla?.split(',').filter(Boolean) ?? []

  const accordionItems = [
    availableColors.length > 0
      ? {
          id: 'colores',
          trigger: 'Colores',
          content: (
            <div className="flex flex-wrap gap-3 pt-1">
              {availableColors.map((color) => {
                const isSelected = draftColorIds.includes(color.id)
                return (
                  <button
                    key={color.id}
                    type="button"
                    aria-label={`${isSelected ? 'Quitar' : 'Agregar'} color ${color.name}`}
                    aria-pressed={isSelected}
                    onClick={() => toggleColor(color.id)}
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full',
                      'border-2 transition-all duration-150',
                      'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                      isSelected
                        ? 'border-accent-gold scale-110 shadow-sm'
                        : 'border-transparent hover:border-border',
                    )}
                    title={color.name}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                )
              })}
            </div>
          ),
        }
      : null,
    availableSizes.length > 0
      ? {
          id: 'tallas',
          trigger: 'Tallas',
          content: (
            <div className="flex flex-wrap gap-2 pt-1">
              {availableSizes.map((size) => {
                const isSelected = draftSizeIds.includes(size.id)
                return (
                  <button
                    key={size.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleSize(size.id)}
                    className={cn(
                      'min-w-[44px] h-9 px-3 rounded-sm border font-sans text-sm',
                      'transition-colors duration-150',
                      'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                      isSelected
                        ? 'bg-accent-gold text-text-primary-inverse border-accent-gold'
                        : 'bg-surface text-text-primary border-border hover:border-border-hover',
                    )}
                  >
                    {size.name}
                  </button>
                )
              })}
            </div>
          ),
        }
      : null,
    {
      id: 'precio',
      trigger: 'Precio',
      content: (
        <div className="flex items-center gap-2 pt-1">
          <Input
            type="number"
            placeholder={String(priceRange.min)}
            min={priceRange.min}
            max={draft.precio_max ?? priceRange.max}
            value={draft.precio_min ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined
              setDraft((d) => ({ ...d, precio_min: val }))
            }}
            aria-label="Precio mínimo"
          />
          <span className="text-text-secondary font-sans text-sm shrink-0">–</span>
          <Input
            type="number"
            placeholder={String(priceRange.max)}
            min={draft.precio_min ?? priceRange.min}
            max={priceRange.max}
            value={draft.precio_max ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined
              setDraft((d) => ({ ...d, precio_max: val }))
            }}
            aria-label="Precio máximo"
          />
        </div>
      ),
    },
    {
      id: 'disponibilidad',
      trigger: 'Disponibilidad',
      content: (
        <div className="flex flex-col gap-3 pt-1">
          <Checkbox
            label="Solo disponibles"
            checked={draft.disponible === 'true'}
            onChange={(e) =>
              setDraft((d) => ({ ...d, disponible: e.target.checked ? 'true' : undefined }))
            }
          />
          <Checkbox
            label="Nuevo"
            checked={draft.nuevo === 'true'}
            onChange={(e) =>
              setDraft((d) => ({ ...d, nuevo: e.target.checked ? 'true' : undefined }))
            }
          />
          <Checkbox
            label="En oferta"
            checked={draft.oferta === 'true'}
            onChange={(e) =>
              setDraft((d) => ({ ...d, oferta: e.target.checked ? 'true' : undefined }))
            }
          />
        </div>
      ),
    },
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <>
      {/* Trigger button — only visible on mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 md:hidden">
        <button
          type="button"
          onClick={openSheet}
          className={cn(
            'flex items-center gap-2 px-5 h-11 rounded-pill shadow-lg',
            'bg-surface-2 border border-border text-text-primary font-sans text-sm font-medium',
            'transition-transform duration-150 active:scale-95',
            'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
          )}
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4h12M4 8h8M6 12h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent-gold text-text-primary-inverse text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Bottom sheet */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Filtros"
      >
        {/* Clear button inside sheet header area */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-sans text-sm text-text-secondary">
            {activeFilterCount > 0
              ? `${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} activo${activeFilterCount > 1 ? 's' : ''}`
              : 'Sin filtros activos'}
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className={cn(
              'font-sans text-xs text-text-secondary hover:text-text-primary',
              'transition-colors duration-150 underline underline-offset-2',
              'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded',
            )}
          >
            Limpiar
          </button>
        </div>

        <Accordion items={accordionItems} allowMultiple />

        {/* Sticky CTA */}
        <div className="sticky bottom-0 pt-4 pb-2 bg-surface border-t border-border mt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={applyFilters}
          >
            Ver {totalResults} producto{totalResults !== 1 ? 's' : ''}
          </Button>
        </div>
      </BottomSheet>
    </>
  )
}
