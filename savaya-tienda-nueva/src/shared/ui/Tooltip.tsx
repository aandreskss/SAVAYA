'use client'

import {
  useState,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: TooltipSide
  className?: string
}

const sideClasses: Record<TooltipSide, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const uid = useId()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function show() {
    timeoutRef.current = setTimeout(() => setVisible(true), 300)
  }

  function hide() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={visible ? uid : undefined}>{children}</span>

      {visible && (
        <span
          id={uid}
          role="tooltip"
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-sm',
            'bg-surface-3 text-text-primary border border-border',
            'font-sans text-xs px-2 py-1 shadow-md',
            'pointer-events-none',
            sideClasses[side],
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
