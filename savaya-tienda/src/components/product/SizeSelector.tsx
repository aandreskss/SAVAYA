'use client'

import { cn } from '@/lib/utils'

interface SizeSelectorProps {
  sizes: string[]
  selected: string | null
  onSelect: (size: string) => void
  outOfStock?: string[]
}

export default function SizeSelector({ sizes, selected, onSelect, outOfStock = [] }: SizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const unavailable = outOfStock.includes(size)
        return (
          <button
            key={size}
            disabled={unavailable}
            onClick={() => onSelect(size)}
            className={cn(
              'min-w-[2.5rem] h-10 px-3 border text-sm font-medium rounded transition-colors',
              selected === size
                ? 'border-black bg-black text-white'
                : 'border-gray-light hover:border-black',
              unavailable && 'opacity-40 cursor-not-allowed line-through'
            )}
          >
            {size}
          </button>
        )
      })}
    </div>
  )
}
