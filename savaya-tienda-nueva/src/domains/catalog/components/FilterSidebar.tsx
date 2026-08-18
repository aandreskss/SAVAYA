'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Accordion } from '@/shared/ui'
import { Checkbox } from '@/shared/ui'
import { Badge } from '@/shared/ui'
import { Input } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { PLPSearchParams } from '../search-params'
import { buildFilterUrl } from '../search-params'

export type FilterSidebarProps = {
  availableColors: { id: string; name: string; hex: string }[]
  availableSizes: { id: string; name: string }[]
  priceRange: { min: number; max: number }
  activeFilters: PLPSearchParams
}

export function FilterSidebar({
  availableColors,
  availableSizes,
  priceRange,
  activeFilters,
}: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  function navigate(patch: Partial<PLPSearchParams>) {
    // Reset page when any filter changes
    const qs = buildFilterUrl({ ...activeFilters, ...patch }, { pagina: 1 })
    router.push(`${pathname}${qs}`, { scroll: false })
  }

  function toggleColor(colorId: string) {
    const current = activeFilters.color?.split(',').filter(Boolean) ?? []
    const next = current.includes(colorId)
      ? current.filter((id) => id !== colorId)
      : [...current, colorId]
    navigate({ color: next.length > 0 ? next.join(',') : undefined })
  }

  function toggleSize(sizeId: string) {
    const current = activeFilters.talla?.split(',').filter(Boolean) ?? []
    const next = current.includes(sizeId)
      ? current.filter((id) => id !== sizeId)
      : [...current, sizeId]
    navigate({ talla: next.length > 0 ? next.join(',') : undefined })
  }

  function clearAll() {
    router.push(pathname, { scroll: false })
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

  const activeColorIds = activeFilters.color?.split(',').filter(Boolean) ?? []
  const activeSizeIds = activeFilters.talla?.split(',').filter(Boolean) ?? []

  const accordionItems = [
    availableColors.length > 0
      ? {
          id: 'colores',
          trigger: 'Colores',
          content: (
            <div className="flex flex-wrap gap-3 pt-1">
              {availableColors.map((color) => {
                const isSelected = activeColorIds.includes(color.id)
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
                const isSelected = activeSizeIds.includes(size.id)
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
            max={activeFilters.precio_max ?? priceRange.max}
            value={activeFilters.precio_min ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined
              navigate({ precio_min: val })
            }}
            aria-label="Precio mínimo"
            className="w-full text-sm"
          />
          <span className="text-text-secondary font-sans text-sm shrink-0">–</span>
          <Input
            type="number"
            placeholder={String(priceRange.max)}
            min={activeFilters.precio_min ?? priceRange.min}
            max={priceRange.max}
            value={activeFilters.precio_max ?? ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined
              navigate({ precio_max: val })
            }}
            aria-label="Precio máximo"
            className="w-full text-sm"
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
            checked={activeFilters.disponible === 'true'}
            onChange={(e) =>
              navigate({ disponible: e.target.checked ? 'true' : undefined })
            }
          />
          <Checkbox
            label="Nuevo"
            checked={activeFilters.nuevo === 'true'}
            onChange={(e) =>
              navigate({ nuevo: e.target.checked ? 'true' : undefined })
            }
          />
          <Checkbox
            label="En oferta"
            checked={activeFilters.oferta === 'true'}
            onChange={(e) =>
              navigate({ oferta: e.target.checked ? 'true' : undefined })
            }
          />
        </div>
      ),
    },
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-display font-medium text-text-primary text-sm">
          Filtros
          {activeFilterCount > 0 && (
            <Badge variant="default" size="sm" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className={cn(
              'font-sans text-xs text-text-secondary hover:text-text-primary',
              'transition-colors duration-150 underline underline-offset-2',
              'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded',
            )}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Accordion sections */}
      <Accordion items={accordionItems} allowMultiple />
    </div>
  )
}
