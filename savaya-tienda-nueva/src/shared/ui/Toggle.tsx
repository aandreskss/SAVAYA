'use client'

import { useId } from 'react'
import { cn } from '@/shared/lib/utils'

export type ToggleSize = 'sm' | 'md'

export interface ToggleProps {
  label?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: ToggleSize
  id?: string
}

const trackSize: Record<ToggleSize, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
}

const thumbSize: Record<ToggleSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
}

const thumbTranslate: Record<ToggleSize, { on: string; off: string }> = {
  sm: { on: 'translate-x-4', off: 'translate-x-0.5' },
  md: { on: 'translate-x-5', off: 'translate-x-1' },
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  size = 'md',
  id: idProp,
}: ToggleProps) {
  const autoId = useId()
  const id = idProp ?? autoId

  return (
    <div className="flex items-center gap-3">
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full',
          'transition-colors duration-[150ms]',
          'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          trackSize[size],
          checked ? 'bg-accent-gold' : 'bg-border',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute rounded-full bg-white shadow-sm',
            'transition-transform duration-[150ms]',
            thumbSize[size],
            checked ? thumbTranslate[size].on : thumbTranslate[size].off,
          )}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'font-sans text-sm font-medium text-text-primary cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  )
}
