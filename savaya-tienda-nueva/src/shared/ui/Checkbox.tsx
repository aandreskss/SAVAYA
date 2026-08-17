import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  error?: string
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="10"
      height="8"
      viewBox="0 0 10 8"
      fill="none"
    >
      <path
        d="M1 4l3 3 5-6"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    { label, description, error, id: idProp, className, ...props },
    ref,
  ) {
    const autoId = useId()
    const id = idProp ?? autoId
    const errorId = `${id}-error`

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={id}
          className={cn(
            'flex cursor-pointer items-start gap-3',
            props.disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {/* Hidden native input */}
          <input
            ref={ref}
            type="checkbox"
            id={id}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="peer sr-only"
            {...props}
          />

          {/* Custom checkbox visual */}
          <span
            className={cn(
              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px]',
              'border border-border bg-surface',
              'transition-colors duration-[150ms]',
              'peer-checked:bg-accent-gold peer-checked:border-accent-gold',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-accent-gold peer-focus-visible:ring-offset-1',
              error && 'border-error',
              className,
            )}
          >
            <span className="hidden peer-checked:flex">
              <CheckIcon />
            </span>
          </span>

          <span className="flex flex-col gap-0.5">
            {label && (
              <span className="font-sans text-sm font-medium text-text-primary leading-none">
                {label}
              </span>
            )}
            {description && (
              <span className="font-sans text-xs text-text-secondary">
                {description}
              </span>
            )}
          </span>
        </label>

        {error && (
          <p id={errorId} role="alert" className="font-sans text-sm text-error pl-7">
            {error}
          </p>
        )}
      </div>
    )
  },
)
