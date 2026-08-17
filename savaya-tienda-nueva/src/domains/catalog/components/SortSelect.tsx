'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select } from '@/shared/ui'
import type { PLPSearchParams } from '../search-params'
import { buildFilterUrl, parsePLPSearchParams } from '../search-params'

const SORT_OPTIONS: { value: PLPSearchParams['orden']; label: string }[] = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'nuevos', label: 'Más nuevos' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'mas-vendidos', label: 'Más vendidos' },
]

type SortSelectProps = {
  currentSort: PLPSearchParams['orden']
}

export function SortSelect({ currentSort }: SortSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(value: string) {
    const parsed = parsePLPSearchParams(
      Object.fromEntries(searchParams.entries()),
    )
    const qs = buildFilterUrl(parsed, {
      orden: value as PLPSearchParams['orden'],
      pagina: 1,
    })
    router.push(`${pathname}${qs}`)
  }

  return (
    <Select
      aria-label="Ordenar productos"
      value={currentSort}
      onChange={(e) => handleChange(e.target.value)}
      className="text-sm h-9 min-w-[180px]"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  )
}
