import { z } from 'zod'
import type { ProductFilters } from './repository'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const PLPSearchParamsSchema = z.object({
  color: z.string().optional(),
  talla: z.string().optional(),
  precio_min: z.coerce.number().min(0).optional(),
  precio_max: z.coerce.number().min(0).optional(),
  disponible: z.enum(['true']).optional(),
  nuevo: z.enum(['true']).optional(),
  oferta: z.enum(['true']).optional(),
  orden: z
    .enum(['destacados', 'nuevos', 'precio-asc', 'precio-desc', 'mas-vendidos'])
    .default('destacados'),
  pagina: z.coerce.number().min(1).default(1),
})

export type PLPSearchParams = z.infer<typeof PLPSearchParamsSchema>

// ---------------------------------------------------------------------------
// Parser — never throws at the user
// ---------------------------------------------------------------------------

export function parsePLPSearchParams(
  raw: Record<string, string | string[] | undefined>,
): PLPSearchParams {
  // Flatten arrays to first value (Next.js can send string[] for repeated params)
  const flattened: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(raw)) {
    flattened[key] = Array.isArray(value) ? value[0] : value
  }

  const result = PLPSearchParamsSchema.safeParse(flattened)
  if (result.success) return result.data

  // On parse error, apply defaults field by field
  const fallback = PLPSearchParamsSchema.parse({})
  return fallback
}

// ---------------------------------------------------------------------------
// Map orden → ProductFilters sortBy
// ---------------------------------------------------------------------------

function mapOrden(
  orden: PLPSearchParams['orden'],
): ProductFilters['sortBy'] {
  switch (orden) {
    case 'nuevos':
      return 'newest'
    case 'precio-asc':
      return 'price_asc'
    case 'precio-desc':
      return 'price_desc'
    case 'mas-vendidos':
      return 'bestseller'
    default:
      return 'featured'
  }
}

// ---------------------------------------------------------------------------
// searchParamsToFilters
// ---------------------------------------------------------------------------

export function searchParamsToFilters(
  params: PLPSearchParams,
  categorySlug?: string,
): ProductFilters {
  return {
    categorySlug,
    colorIds: params.color?.split(',').filter(Boolean),
    sizeIds: params.talla?.split(',').filter(Boolean),
    minPrice: params.precio_min,
    maxPrice: params.precio_max,
    onlyAvailable: params.disponible === 'true',
    onlyNew: params.nuevo === 'true',
    onlyOnSale: params.oferta === 'true',
    sortBy: mapOrden(params.orden),
    page: params.pagina,
  }
}

// ---------------------------------------------------------------------------
// SEO — shouldNoindex
// Implements the rule from docs/SEO.md:
//   - 0 filters → indexable
//   - 1 filter → indexable
//   - 2+ filters → noindex
//   - price filters → noindex (counted separately)
//   - availability filter → noindex
//   - explicit sort → noindex
// ---------------------------------------------------------------------------

export function shouldNoindex(params: PLPSearchParams): boolean {
  const activeFilterCount = [
    params.color,
    params.talla,
    params.precio_min !== undefined ? String(params.precio_min) : undefined,
    params.precio_max !== undefined ? String(params.precio_max) : undefined,
    params.disponible,
    params.nuevo,
    params.oferta,
  ].filter(Boolean).length

  // Price and availability filters are always noindex per SEO.md
  const hasPriceFilter =
    params.precio_min !== undefined || params.precio_max !== undefined
  const hasAvailabilityFilter = params.disponible === 'true'
  // Explicit non-default sort
  const hasSortParam = params.orden !== 'destacados'

  return (
    activeFilterCount >= 2 ||
    hasPriceFilter ||
    hasAvailabilityFilter ||
    hasSortParam
  )
}

// ---------------------------------------------------------------------------
// URL helpers — build a new search string mutating only the changed param
// ---------------------------------------------------------------------------

export function buildFilterUrl(
  currentParams: PLPSearchParams,
  patch: Partial<PLPSearchParams>,
): string {
  const next = { ...currentParams, ...patch }
  const params = new URLSearchParams()

  if (next.color) params.set('color', next.color)
  if (next.talla) params.set('talla', next.talla)
  if (next.precio_min !== undefined) params.set('precio_min', String(next.precio_min))
  if (next.precio_max !== undefined) params.set('precio_max', String(next.precio_max))
  if (next.disponible) params.set('disponible', 'true')
  if (next.nuevo) params.set('nuevo', 'true')
  if (next.oferta) params.set('oferta', 'true')
  if (next.orden && next.orden !== 'destacados') params.set('orden', next.orden)
  if (next.pagina && next.pagina > 1) params.set('pagina', String(next.pagina))

  const qs = params.toString()
  return qs ? `?${qs}` : ''
}
