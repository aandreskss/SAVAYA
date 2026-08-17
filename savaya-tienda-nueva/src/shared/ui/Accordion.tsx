'use client'

import { useState, useId, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface AccordionItem {
  id: string
  trigger: ReactNode
  content: ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  className?: string
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={cn(
        'shrink-0 transition-transform duration-[200ms]',
        open && 'rotate-180',
      )}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Accordion({
  items,
  allowMultiple = false,
  className,
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const uid = useId()

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!allowMultiple) next.clear()
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className={cn('divide-y divide-border', className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id)
        const triggerId = `${uid}-trigger-${item.id}`
        const panelId = `${uid}-panel-${item.id}`

        return (
          <div key={item.id}>
            <h3>
              <button
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-4',
                  'py-4 font-sans text-sm font-medium text-text-primary text-left',
                  'transition-colors duration-[150ms] hover:text-accent-gold',
                  'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                )}
              >
                <span>{item.trigger}</span>
                <ChevronIcon open={isOpen} />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className="pb-4 font-sans text-sm text-text-secondary"
            >
              {item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
