import type { ReactNode } from 'react'
import { Skeleton } from './Skeleton'
import { cn } from '@/shared/lib/utils'

export type KPICardProps = {
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: ReactNode
  isLoading?: boolean
  className?: string
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
        <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (trend === 'down') {
    return (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
        <path d="M7 3v8M3 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const trendColorMap: Record<'up' | 'down' | 'neutral', string> = {
  up: 'text-success',
  down: 'text-error',
  neutral: 'text-text-secondary',
}

export function KPICard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  icon,
  isLoading = false,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 p-5',
        'bg-surface border border-border rounded-lg shadow-sm',
        className,
      )}
    >
      {/* Ícono opcional */}
      {icon && (
        <span
          aria-hidden="true"
          className="absolute top-4 right-4 text-text-secondary/50"
        >
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="font-sans text-sm text-text-secondary">{label}</span>

      {/* Valor principal */}
      {isLoading ? (
        <Skeleton variant="text" height={32} width="60%" />
      ) : (
        <span className="font-display font-medium text-3xl text-text-primary leading-none">
          {value}
        </span>
      )}

      {/* Trend + subValue */}
      <div className="flex items-center gap-2 flex-wrap">
        {trend && trendValue && (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-sans text-sm font-medium',
              trendColorMap[trend],
            )}
          >
            <TrendArrow trend={trend} />
            {trendValue}
          </span>
        )}
        {subValue && (
          <span className="font-sans text-xs text-text-secondary">{subValue}</span>
        )}
      </div>
    </div>
  )
}
