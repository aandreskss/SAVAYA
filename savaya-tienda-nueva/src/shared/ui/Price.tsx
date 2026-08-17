import { Badge } from './Badge'
import { cn } from '@/shared/lib/utils'

export type PriceSize = 'sm' | 'md' | 'lg'

export interface PriceProps {
  amount: number
  currency?: string
  compareAtAmount?: number
  discountBadge?: string
  size?: PriceSize
  className?: string
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const sizeClasses: Record<PriceSize, { main: string; compare: string }> = {
  sm: { main: 'text-base font-semibold', compare: 'text-sm' },
  md: { main: 'text-lg font-semibold', compare: 'text-sm' },
  lg: { main: 'text-2xl font-semibold', compare: 'text-base' },
}

export function Price({
  amount,
  currency = 'USD',
  compareAtAmount,
  discountBadge,
  size = 'md',
  className,
}: PriceProps) {
  const hasCompare =
    compareAtAmount !== undefined && compareAtAmount > amount

  return (
    <div className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      <span
        className={cn(
          'font-sans text-text-primary',
          sizeClasses[size].main,
        )}
      >
        {formatPrice(amount, currency)}
      </span>

      {hasCompare && (
        <span
          className={cn(
            'font-sans line-through text-text-secondary',
            sizeClasses[size].compare,
          )}
        >
          {formatPrice(compareAtAmount, currency)}
        </span>
      )}

      {discountBadge && (
        <Badge variant="error" size="sm">
          {discountBadge}
        </Badge>
      )}
    </div>
  )
}
