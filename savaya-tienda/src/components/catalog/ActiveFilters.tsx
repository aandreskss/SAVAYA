'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { useCurrency } from '@/components/providers/CurrencyProvider'

const PRICE_MAX = 500_000

interface Chip {
  key: string
  label: string
  // individual value to remove from comma list, or null to delete the whole key
  itemValue: string | null
}

export default function ActiveFilters() {
  const currency = useCurrency()
  const router = useRouter()
  const searchParams = useSearchParams()

  const chips: Chip[] = []

  const tallas = searchParams.get('tallas')
  tallas?.split(',').filter(Boolean).forEach((t) => {
    chips.push({ key: 'tallas', label: `Talla: ${t}`, itemValue: t })
  })

  const colores = searchParams.get('colores')
  colores?.split(',').filter(Boolean).forEach((c) => {
    chips.push({ key: 'colores', label: `Color: ${c}`, itemValue: c })
  })

  const precioMin = searchParams.get('precio_min')
  if (precioMin && Number(precioMin) > 0) {
    chips.push({ key: 'precio_min', label: `Desde ${formatPrice(Number(precioMin), currency)}`, itemValue: null })
  }

  const precioMax = searchParams.get('precio_max')
  if (precioMax && Number(precioMax) < PRICE_MAX) {
    chips.push({ key: 'precio_max', label: `Hasta ${formatPrice(Number(precioMax), currency)}`, itemValue: null })
  }

  const GENDER_LABELS: Record<string, string> = { women: 'Mujer', men: 'Hombre', kids: 'Niños' }
  const generos = searchParams.get('generos')
  generos?.split(',').filter(Boolean).forEach((g) => {
    chips.push({ key: 'generos', label: `Género: ${GENDER_LABELS[g] ?? g}`, itemValue: g })
  })

  if (searchParams.get('descuento') === 'true') {
    chips.push({ key: 'descuento', label: 'Solo descuentos', itemValue: null })
  }

  if (chips.length === 0) return null

  function removeChip(chip: Chip) {
    const params = new URLSearchParams(searchParams.toString())
    if (chip.itemValue === null) {
      params.delete(chip.key)
    } else {
      const current = params.get(chip.key)?.split(',').filter(Boolean) ?? []
      const updated = current.filter((v) => v !== chip.itemValue)
      updated.length > 0 ? params.set(chip.key, updated.join(',')) : params.delete(chip.key)
    }
    params.delete('pagina')
    router.replace(`?${params}`, { scroll: false })
  }

  function clearAll() {
    const params = new URLSearchParams()
    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    router.replace(`?${params}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => removeChip(chip)}
          className="flex items-center gap-1.5 bg-white border border-gray-light rounded-full px-3 py-1 text-xs hover:border-black transition-colors group"
        >
          {chip.label}
          <span className="text-gray-text group-hover:text-black leading-none">×</span>
        </button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={clearAll}
          className="text-xs underline underline-offset-2 text-gray-text hover:text-black"
        >
          Limpiar todo
        </button>
      )}
    </div>
  )
}
