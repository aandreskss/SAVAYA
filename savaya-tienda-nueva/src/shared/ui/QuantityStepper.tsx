'use client'

import { cn } from '@/shared/lib/utils'

export type QuantityStepperProps = {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  disabled?: boolean
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
}: QuantityStepperProps) {
  const canDecrement = !disabled && value > min
  const canIncrement = !disabled && value < max

  return (
    <div
      role="group"
      aria-label="Cantidad"
      className={cn(
        'inline-flex items-center border border-border rounded-sm',
        disabled && 'opacity-50',
      )}
    >
      <button
        type="button"
        aria-label="Reducir cantidad"
        disabled={!canDecrement}
        onClick={() => canDecrement && onChange(value - 1)}
        className={cn(
          'flex items-center justify-center w-11 h-11',
          'text-text-primary',
          'transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
          canDecrement
            ? 'hover:bg-white/8 active:bg-white/12 cursor-pointer'
            : 'cursor-not-allowed text-text-secondary',
        )}
      >
        <MinusIcon />
      </button>

      <span
        aria-live="polite"
        aria-atomic="true"
        className="min-w-[44px] h-11 flex items-center justify-center font-sans text-sm font-medium text-text-primary border-x border-border select-none"
      >
        {value}
      </span>

      <button
        type="button"
        aria-label="Aumentar cantidad"
        disabled={!canIncrement}
        onClick={() => canIncrement && onChange(value + 1)}
        className={cn(
          'flex items-center justify-center w-11 h-11',
          'text-text-primary',
          'transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
          canIncrement
            ? 'hover:bg-white/8 active:bg-white/12 cursor-pointer'
            : 'cursor-not-allowed text-text-secondary',
        )}
      >
        <PlusIcon />
      </button>
    </div>
  )
}
