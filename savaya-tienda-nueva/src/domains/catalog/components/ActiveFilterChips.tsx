'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Chip } from '@/shared/ui'
import type { PLPSearchParams } from '../search-params'
import { buildFilterUrl } from '../search-params'

type ActiveFilterChipsProps = {
  activeFilters: PLPSearchParams
  colorNames?: Record<string, string>
  sizeNames?: Record<string, string>
}

type FilterChip = {
  key: string
  label: string
  onRemove: () => void
}

const ORDEN_LABELS: Record<string, string> = {
  nuevos: 'Orden: Más nuevos',
  'precio-asc': 'Orden: Menor precio',
  'precio-desc': 'Orden: Mayor precio',
  'mas-vendidos': 'Orden: Más vendidos',
}

export function ActiveFilterChips({
  activeFilters,
  colorNames = {},
  sizeNames = {},
}: ActiveFilterChipsProps) {
  const router = useRouter()
  const pathname = usePathname()

  function navigate(patch: Partial<PLPSearchParams>) {
    const qs = buildFilterUrl({ ...activeFilters, ...patch }, { pagina: 1 })
    router.push(`${pathname}${qs}`)
  }

  const chips: FilterChip[] = []

  // Color chips
  const colorIds = activeFilters.color?.split(',').filter(Boolean) ?? []
  for (const id of colorIds) {
    chips.push({
      key: `color-${id}`,
      label: colorNames[id] ?? `Color`,
      onRemove: () => {
        const remaining = colorIds.filter((c) => c !== id)
        navigate({ color: remaining.length > 0 ? remaining.join(',') : undefined })
      },
    })
  }

  // Size chips
  const sizeIds = activeFilters.talla?.split(',').filter(Boolean) ?? []
  for (const id of sizeIds) {
    chips.push({
      key: `talla-${id}`,
      label: `Talla ${sizeNames[id] ?? id}`,
      onRemove: () => {
        const remaining = sizeIds.filter((s) => s !== id)
        navigate({ talla: remaining.length > 0 ? remaining.join(',') : undefined })
      },
    })
  }

  // Price chip
  if (activeFilters.precio_min !== undefined || activeFilters.precio_max !== undefined) {
    const min = activeFilters.precio_min
    const max = activeFilters.precio_max
    const label =
      min !== undefined && max !== undefined
        ? `$${min} – $${max}`
        : min !== undefined
          ? `Desde $${min}`
          : `Hasta $${max}`

    chips.push({
      key: 'precio',
      label,
      onRemove: () => navigate({ precio_min: undefined, precio_max: undefined }),
    })
  }

  // Disponible chip
  if (activeFilters.disponible === 'true') {
    chips.push({
      key: 'disponible',
      label: 'Solo disponibles',
      onRemove: () => navigate({ disponible: undefined }),
    })
  }

  // Nuevo chip
  if (activeFilters.nuevo === 'true') {
    chips.push({
      key: 'nuevo',
      label: 'Nuevo',
      onRemove: () => navigate({ nuevo: undefined }),
    })
  }

  // Oferta chip
  if (activeFilters.oferta === 'true') {
    chips.push({
      key: 'oferta',
      label: 'En oferta',
      onRemove: () => navigate({ oferta: undefined }),
    })
  }

  // Orden chip (only if not default)
  if (activeFilters.orden && activeFilters.orden !== 'destacados') {
    chips.push({
      key: 'orden',
      label: ORDEN_LABELS[activeFilters.orden] ?? activeFilters.orden,
      onRemove: () => navigate({ orden: 'destacados' }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Chip key={chip.key} onRemove={chip.onRemove}>
          {chip.label}
        </Chip>
      ))}

      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="font-sans text-xs text-text-secondary hover:text-text-primary underline underline-offset-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded"
        >
          Limpiar todo
        </button>
      )}
    </div>
  )
}
