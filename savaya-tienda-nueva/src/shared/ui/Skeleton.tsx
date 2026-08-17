import { cn } from '@/shared/lib/utils'

export type SkeletonVariant = 'text' | 'circle' | 'rect'

export interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'rounded',
  circle: 'rounded-full',
  rect: 'rounded-sm',
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {}
  if (width !== undefined)
    style.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined)
    style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        'block bg-border',
        'animate-[shimmer_1.5s_ease-in-out_infinite]',
        '[background:linear-gradient(90deg,var(--color-border)_25%,var(--color-surface)_50%,var(--color-border)_75%)]',
        '[background-size:200%_100%]',
        variantClasses[variant],
        className,
      )}
    />
  )
}
