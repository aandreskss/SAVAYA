'use client'

import {
  useEffect,
  useRef,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/shared/lib/utils'

export type DrawerSide = 'right' | 'left'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  side?: DrawerSide
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'

const sidePosition: Record<DrawerSide, string> = {
  right: 'right-0',
  left: 'left-0',
}

const slideTransform: Record<DrawerSide, { closed: string; open: string }> = {
  right: { closed: 'translate-x-full', open: 'translate-x-0' },
  left: { closed: '-translate-x-full', open: 'translate-x-0' },
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const panel = panelRef.current
    if (!panel) return
    const first = panel.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
  }, [isOpen])

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab') return

    const panel = panelRef.current
    if (!panel) return
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/60',
          'transition-opacity duration-[250ms]',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'absolute top-0 bottom-0 w-full max-w-sm bg-surface shadow-lg',
          'flex flex-col',
          'transition-transform duration-[250ms]',
          sidePosition[side],
          isOpen ? slideTransform[side].open : slideTransform[side].closed,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          {title && (
            <h2
              id={titleId}
              className="font-display font-medium text-lg text-text-primary"
            >
              {title}
            </h2>
          )}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className={cn(
              'ml-auto h-8 w-8 flex items-center justify-center rounded-pill',
              'text-text-secondary hover:text-text-primary hover:bg-white/8',
              'transition-colors duration-[150ms]',
              'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
            )}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
