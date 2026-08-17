import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type BadgeVariant =
  | 'default'
  | 'gold'
  | 'success'
  | 'warning'
  | 'error'
  | 'outline'

export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-surface-2 text-text-secondary',
  gold:     'bg-accent-gold-soft text-accent-gold border border-accent-gold/25',
  success:  'bg-success/15 text-success',
  warning:  'bg-warning/15 text-warning',
  error:    'bg-error/15 text-error',
  outline:  'border border-border text-text-secondary bg-transparent',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-sans font-medium rounded-pill',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
