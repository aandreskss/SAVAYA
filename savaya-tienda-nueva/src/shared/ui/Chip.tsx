import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface ChipProps {
  children: ReactNode
  onRemove?: () => void
  className?: string
  disabled?: boolean
}

export function Chip({ children, onRemove, className, disabled }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border border-border',
        'bg-surface text-text-primary font-sans text-sm px-3 py-1',
        disabled && 'opacity-50',
        className,
      )}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          aria-label="Quitar filtro"
          disabled={disabled}
          onClick={onRemove}
          className={cn(
            'ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
            'text-text-secondary hover:bg-black/10 hover:text-text-primary',
            'transition-colors duration-[150ms]',
            'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-1',
            'disabled:pointer-events-none',
          )}
        >
          <svg
            aria-hidden="true"
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
          >
            <path
              d="M1 1l6 6M7 1L1 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  )
}
