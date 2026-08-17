'use client'

import { cn } from '@/shared/lib/utils'

export type SizeOption = {
  id: string
  name: string
  isAvailable: boolean
}

export type SizeSelectorProps = {
  sizes: SizeOption[]
  selectedSizeId?: string
  onChange: (sizeId: string) => void
  label?: string
  onGuideClick?: () => void
}

export function SizeSelector({
  sizes,
  selectedSizeId,
  onChange,
  label = 'Talla',
  onGuideClick,
}: SizeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {label && (
          <span className="font-sans text-sm font-medium text-text-primary">
            {label}
          </span>
        )}
        {onGuideClick && (
          <button
            type="button"
            onClick={onGuideClick}
            className={cn(
              'font-sans text-xs text-text-secondary underline underline-offset-2',
              'hover:text-text-primary transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded',
            )}
          >
            Guía de tallas →
          </button>
        )}
      </div>

      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = size.id === selectedSizeId

          return (
            <button
              key={size.id}
              type="button"
              disabled={!size.isAvailable}
              aria-label={`Talla ${size.name}, ${size.isAvailable ? 'disponible' : 'agotada'}`}
              aria-pressed={isSelected}
              onClick={() => {
                if (size.isAvailable) onChange(size.id)
              }}
              className={cn(
                'relative inline-flex items-center justify-center',
                'min-w-[44px] h-11 px-3',
                'font-sans text-sm font-medium',
                'border rounded-sm',
                'transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                isSelected
                  ? 'bg-accent-gold text-text-primary-inverse border-accent-gold'
                  : 'bg-transparent text-text-primary border-border hover:border-border-hover',
                !size.isAvailable &&
                  'text-text-secondary bg-transparent border-border cursor-not-allowed hover:border-border',
              )}
            >
              <span className={cn(size.isAvailable ? '' : 'opacity-50')}>
                {size.name}
              </span>

              {/* Línea diagonal para tallas agotadas */}
              {!size.isAvailable && (
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full rounded-sm overflow-hidden pointer-events-none"
                  viewBox="0 0 44 44"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <line
                    x1="0"
                    y1="44"
                    x2="44"
                    y2="0"
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
