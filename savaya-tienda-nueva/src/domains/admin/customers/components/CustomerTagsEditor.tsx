'use client'

import { useTransition } from 'react'
import { setCustomerTagAction } from '../actions'
import { TAG_CONFIG } from '../types'
import { toast } from '@/shared/ui/toast-store'
import type { CustomerTag } from '../types'

type Props = {
  customerId: string
  activeTags: CustomerTag[]
}

export function CustomerTagsEditor({ customerId, activeTags }: Props) {
  const [isPending, startTransition] = useTransition()
  const activeSet = new Set(activeTags)

  function toggle(tag: CustomerTag) {
    const active = !activeSet.has(tag)
    startTransition(async () => {
      const result = await setCustomerTagAction({ customerId, tag, active })
      if (!result.success) toast.error(result.error)
    })
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">Etiquetas</h3>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAG_CONFIG) as CustomerTag[]).map((tag) => {
          const isActive = activeSet.has(tag)
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              disabled={isPending}
              aria-pressed={isActive}
              className={`rounded-pill text-xs px-3 py-1 font-medium transition-all border focus:outline-none focus:ring-2 focus:ring-accent-gold/20 disabled:opacity-50 ${
                isActive
                  ? TAG_CONFIG[tag].color + ' border-transparent'
                  : 'border-border text-text-secondary bg-transparent hover:border-accent-gold/30'
              }`}
            >
              {TAG_CONFIG[tag].label}
            </button>
          )
        })}
      </div>
      {activeTags.length === 0 && (
        <p className="text-xs text-text-secondary">Sin etiquetas. Toca una para asignarla.</p>
      )}
    </div>
  )
}
