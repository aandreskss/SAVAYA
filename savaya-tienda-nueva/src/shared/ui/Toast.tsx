'use client'

import { useEffect, type ReactNode } from 'react'
import { useToastStore, type ToastItem, type ToastVariant } from './toast-store'
import { cn } from '@/shared/lib/utils'

export { toast } from './toast-store'

const DEFAULT_DURATION = 4000

// ─── Icons ──────────────────────────────────────────────────────────────────

function SuccessIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 9l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L16.5 15H1.5L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 7v3.5M9 12.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8v5M9 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const variantMeta: Record<
  ToastVariant,
  { icon: ReactNode; classes: string; role: 'status' | 'alert' }
> = {
  success: {
    icon: <SuccessIcon />,
    classes: 'text-success',
    role: 'status',
  },
  error: {
    icon: <ErrorIcon />,
    classes: 'text-error',
    role: 'alert',
  },
  warning: {
    icon: <WarningIcon />,
    classes: 'text-warning',
    role: 'status',
  },
  info: {
    icon: <InfoIcon />,
    classes: 'text-text-secondary',
    role: 'status',
  },
}

// ─── Single toast ────────────────────────────────────────────────────────────

function ToastCard({ toast: item }: { toast: ToastItem }) {
  const remove = useToastStore((s) => s.removeToast)
  const duration = item.duration ?? DEFAULT_DURATION
  const meta = variantMeta[item.variant]

  useEffect(() => {
    const timer = setTimeout(() => remove(item.id), duration)
    return () => clearTimeout(timer)
  }, [item.id, duration, remove])

  return (
    <div
      role={meta.role}
      aria-live={meta.role === 'alert' ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-3 rounded-md border border-border bg-surface shadow-md',
        'px-4 py-3 min-w-[260px] max-w-sm w-full',
        'animate-[slideInUp_200ms_ease-out]',
      )}
    >
      <span className={cn('mt-0.5 shrink-0', meta.classes)}>{meta.icon}</span>

      <span className="flex-1 font-sans text-sm text-text-primary">
        {item.message}
      </span>

      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={() => remove(item.id)}
        className={cn(
          'shrink-0 h-5 w-5 flex items-center justify-center rounded-sm',
          'text-text-secondary hover:text-text-primary',
          'transition-colors duration-[150ms]',
          'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-1',
        )}
      >
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ─── Container ───────────────────────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notificaciones"
      className={cn(
        'fixed z-[60] flex flex-col gap-2',
        // desktop: bottom-right | mobile: bottom-center
        'bottom-4 right-4 items-end',
        'sm:items-end',
        'max-sm:right-4 max-sm:left-4 max-sm:items-center',
      )}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  )
}
