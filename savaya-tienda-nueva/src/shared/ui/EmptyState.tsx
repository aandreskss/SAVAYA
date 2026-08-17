import type { ReactNode } from 'react'
import { Button } from './Button'
import { cn } from '@/shared/lib/utils'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="text-text-secondary/40 text-5xl"
        >
          {icon}
        </span>
      )}

      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className="font-display font-medium text-xl text-text-primary">
          {title}
        </h3>
        {description && (
          <p className="font-sans text-sm text-text-secondary">{description}</p>
        )}
      </div>

      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
