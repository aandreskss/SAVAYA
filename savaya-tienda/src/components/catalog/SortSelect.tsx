'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SORT_OPTIONS } from '@/lib/constants'
import type { SortOption } from '@/lib/types'

export default function SortSelect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = (searchParams.get('sort') ?? 'featured') as SortOption

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    params.delete('pagina')
    router.replace(`?${params}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-text hidden sm:block shrink-0">Ordenar:</span>
      <select
        value={current}
        onChange={handleChange}
        className="border border-gray-light rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-black cursor-pointer"
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
  )
}
