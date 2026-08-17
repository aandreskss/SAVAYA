import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftAddon?: ReactNode
  rightAddon?: ReactNode
  isRequired?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      error,
      hint,
      leftAddon,
      rightAddon,
      isRequired,
      id: idProp,
      className,
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
          {leftAddon && (
            <span className="absolute left-3 flex items-center text-text-secondary">
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            required={isRequired}
            aria-required={isRequired}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            className={cn(
              'h-11 w-full rounded-sm border bg-surface px-4 font-sans text-base text-text-primary',
              'placeholder:text-text-secondary',
              'transition-colors duration-[150ms]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-1 focus-visible:ring-offset-surface',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-error focus-visible:ring-error'
                : 'border-border',
              leftAddon ? 'pl-10' : undefined,
              rightAddon ? 'pr-10' : undefined,
              className,
            )}
            {...props}
          />
          {rightAddon && (
            <span className="absolute right-3 flex items-center text-text-secondary">
              {rightAddon}
            </span>
          )}
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
