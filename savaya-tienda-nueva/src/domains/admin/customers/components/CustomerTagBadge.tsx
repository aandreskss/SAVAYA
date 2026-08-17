import { TAG_CONFIG } from '../types'
import type { CustomerTag } from '../types'
import { cn } from '@/shared/lib/utils'

export function CustomerTagBadge({
  tag,
  size = 'sm',
}: {
  tag: CustomerTag
  size?: 'sm' | 'md'
}) {
  const config = TAG_CONFIG[tag]
  return (
    <span
      className={cn(
        'inline-flex items-center font-sans font-medium rounded-pill',
        config.color,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
      )}
    >
      {config.label}
    </span>
  )
}
