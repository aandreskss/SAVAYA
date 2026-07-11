'use client'

import { cn } from '@/lib/utils'

interface Color {
  name: string
  hex: string
}

interface ColorSelectorProps {
  colors: Color[]
  selected: string | null
  onSelect: (colorName: string) => void
}

function swatchStyle(hex: string): React.CSSProperties {
  const [h1, h2] = hex.split('|')
  if (h2) {
    return {
      background: `linear-gradient(135deg, ${h1} 50%, ${h2} 50%)`,
      boxShadow: '0 0 0 1.5px #c8c8c8',
    }
  }
  return { backgroundColor: h1 }
}

export default function ColorSelector({ colors, selected, onSelect }: ColorSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map(({ name, hex }) => {
        const isBicolor = hex.includes('|')
        const isWhite = !isBicolor && hex.toUpperCase() === '#FFFFFF'
        const isSelected = selected === name
        return (
          <button
            key={name}
            title={name}
            onClick={() => onSelect(name)}
            className={cn(
              'w-8 h-8 rounded-full border-2 transition-all',
              isSelected
                ? 'border-black scale-110'
                : isWhite || isBicolor
                  ? 'border-gray-light hover:scale-105'
                  : 'border-transparent hover:scale-105',
            )}
            style={swatchStyle(hex)}
            aria-label={name}
            aria-pressed={isSelected}
          />
        )
      })}
    </div>
  )
}
