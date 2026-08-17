import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  isRequired?: boolean
}

function ChevronDown() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="pointer-events-none"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      error,
      hint,
      isRequired,
      id: idProp,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const autoId = useId()
    const id = idProp ?? autoId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const ariaDescribedBy = [
      error ? errorId : null,
      hint && !error ? hintId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="font-sans text-sm font-medium text-text-primary"
          >
            {label}
            {isRequired && (
              <span aria-hidden="true" className="ml-1 text-error">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={id}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            className={cn(
              'h-11 w-full appearance-none rounded-sm border bg-surface px-4 pr-10',
              'font-sans text-base text-text-primary',
              'transition-colors duration-[150ms]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-error focus-visible:ring-error'
                : 'border-border',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <span className="absolute right-3 flex items-center text-text-secondary">
            <ChevronDown />
          </span>
        </div>

        {error && (
          <p id={errorId} role="alert" className="font-sans text-sm text-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="font-sans text-sm text-text-secondary">
            {hint}
          </p>
        )}
      </div>
    )
  },
)
