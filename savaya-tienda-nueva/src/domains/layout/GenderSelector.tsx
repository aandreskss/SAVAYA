'use client'

import { useThemeStore } from './theme-store'
import { cn } from '@/shared/lib/utils'

type Props = {
  variant?: 'navbar' | 'drawer'
}

export function GenderSelector({ variant = 'navbar' }: Props) {
  const { gender, setGender } = useThemeStore()

  if (variant === 'drawer') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setGender('mujer')}
          className={cn(
            'flex-1 rounded-pill py-2.5 font-display text-sm tracking-widest transition-colors',
            gender === 'mujer'
              ? 'bg-accent-gold text-text-primary-inverse'
              : 'border border-border text-text-secondary hover:text-text-primary hover:border-border-hover',
          )}
        >
          SAVAYA
        </button>
        <button
          onClick={() => setGender('hombre')}
          className={cn(
            'flex-1 rounded-pill py-2.5 font-display text-sm tracking-widest transition-colors',
            gender === 'hombre'
              ? 'bg-accent-gold text-text-primary-inverse'
              : 'border border-border text-text-secondary hover:text-text-primary hover:border-border-hover',
          )}
        >
          FOR MEN
        </button>
      </div>
    )
  }

  return (
    <div
      role="group"
      aria-label="Seleccionar línea"
      className="hidden md:flex items-center gap-0.5 rounded-pill border border-border p-0.5"
    >
      <button
        onClick={() => setGender('mujer')}
        aria-pressed={gender === 'mujer'}
        className={cn(
          'rounded-pill px-3 py-1 font-display text-xs tracking-widest transition-colors',
          gender === 'mujer'
            ? 'bg-accent-gold text-text-primary-inverse'
            : 'text-text-secondary hover:text-text-primary',
        )}
      >
        SAVAYA
      </button>
      <button
        onClick={() => setGender('hombre')}
        aria-pressed={gender === 'hombre'}
        className={cn(
          'rounded-pill px-3 py-1 font-display text-xs tracking-widest transition-colors',
          gender === 'hombre'
            ? 'bg-accent-gold text-text-primary-inverse'
            : 'text-text-secondary hover:text-text-primary',
        )}
      >
        FOR MEN
      </button>
    </div>
  )
}
