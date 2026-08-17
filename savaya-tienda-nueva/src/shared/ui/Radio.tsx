import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  function Radio(
    { label, description, id: idProp, className, ...props },
    ref,
  ) {
    const autoId = useId()
    const id = idProp ?? autoId

    return (
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
          type="radio"
          id={id}
          className="peer sr-only"
          {...props}
        />

        {/* Custom radio visual */}
        <span
          className={cn(
            'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
            'border border-border bg-surface',
            'transition-colors duration-[150ms]',
            'peer-checked:border-accent-gold',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-accent-gold peer-focus-visible:ring-offset-1',
            className,
          )}
        >
          <span className="h-2 w-2 rounded-full bg-transparent peer-checked:bg-accent-gold transition-colors duration-[150ms]" />
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
    )
  },
)
