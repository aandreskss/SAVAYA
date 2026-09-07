'use client'

import { cn } from '@/shared/lib/utils'

export type ColorOption = {
  id: string
  name: string
  hex: string
  hex2?: string | null
  isAvailable: boolean
}

export type ColorSelectorProps = {
  colors: ColorOption[]
  selectedColorId?: string
  onChange: (colorId: string) => void
  label?: string
}

export function ColorSelector({
  colors,
  selectedColorId,
  onChange,
  label = 'Color',
}: ColorSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="font-sans text-sm font-medium text-text-primary">
          {label}
          {selectedColorId && (
            <span className="ml-2 font-normal text-text-secondary">
              {colors.find((c) => c.id === selectedColorId)?.name}
            </span>
          )}
        </span>
      )}

      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = color.id === selectedColorId

          return (
            <button
              key={color.id}
              type="button"
              disabled={!color.isAvailable}
              aria-label={`Color: ${color.name}, ${color.isAvailable ? 'disponible' : 'no disponible'}`}
              aria-pressed={isSelected}
              title={color.name}
              onClick={() => {
                if (color.isAvailable) onChange(color.id)
              }}
              className={cn(
                'relative inline-flex items-center justify-center',
                'w-8 h-8 rounded-full shrink-0 overflow-hidden',
                'transition-all duration-150',
                'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                isSelected && 'ring-2 ring-offset-2 ring-accent-gold ring-offset-surface',
                !color.isAvailable && 'cursor-not-allowed opacity-60',
              )}
              style={!color.hex2 ? { backgroundColor: color.hex } : undefined}
            >
              {color.hex2 && (
                <svg viewBox="0 0 32 32" className="absolute inset-0 w-full h-full" aria-hidden="true">
                  <defs>
                    <clipPath id={`cs-l-${color.id}`}><polygon points="0,0 16,0 0,32" /></clipPath>
                    <clipPath id={`cs-r-${color.id}`}><polygon points="16,0 32,0 32,32 0,32" /></clipPath>
                  </defs>
                  <circle cx="16" cy="16" r="16" fill={color.hex} clipPath={`url(#cs-l-${color.id})`} />
                  <circle cx="16" cy="16" r="16" fill={color.hex2} clipPath={`url(#cs-r-${color.id})`} />
                </svg>
              )}
              {/* Diagonal para colores no disponibles */}
              {!color.isAvailable && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 32 32"
                  className="absolute inset-0 w-full h-full"
                  fill="none"
                >
                  <line
                    x1="6"
                    y1="6"
                    x2="26"
                    y2="26"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="6"
                    y1="6"
                    x2="26"
                    y2="26"
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="3"
                    strokeLinecap="round"
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
