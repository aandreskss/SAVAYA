import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type IconButtonVariant = 'default' | 'ghost' | 'danger'
export type IconButtonSize = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obligatorio para accesibilidad */
  'aria-label': string
  variant?: IconButtonVariant
  size?: IconButtonSize
  icon?: ReactNode
}

const variantClasses: Record<IconButtonVariant, string> = {
  default:
    'bg-accent-gold text-text-primary-inverse hover:bg-accent-gold-hover active:opacity-90',
  ghost:
    'text-text-primary bg-transparent hover:bg-white/8 active:bg-white/12',
  danger:
    'bg-error text-white hover:bg-red-800 active:bg-red-900',
}

// sm: 36px, md: 44px (mínimo táctil), lg: 52px
const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-11 w-11 text-base',
  lg: 'h-[52px] w-[52px] text-lg',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      variant = 'default',
      size = 'md',
      disabled,
      className,
      children,
      icon,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-pill',
          'transition-colors duration-[150ms]',
          'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        <span aria-hidden="true">{icon ?? children}</span>
      </button>
    )
  },
)
