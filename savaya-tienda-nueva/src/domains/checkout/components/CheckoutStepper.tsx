'use client'

import type { CheckoutStep } from '../types'

const STEPS = [
  { n: 1, label: 'Datos' },
  { n: 2, label: 'Entrega' },
  { n: 3, label: 'Pago' },
  { n: 4, label: 'Confirmación' },
] as const

export function CheckoutStepper({ current }: { current: CheckoutStep }) {
  return (
    <nav aria-label="Pasos del checkout" className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const done = current > step.n
        const active = current === step.n

        return (
          <div key={step.n} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  done
                    ? 'bg-[var(--color-success)] text-white'
                    : active
                      ? 'bg-accent-gold text-text-primary-inverse'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
                ].join(' ')}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M2 7l3.5 3.5L12 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step.n
                )}
              </div>
              <span
                className={[
                  'hidden text-xs sm:block',
                  active
                    ? 'font-semibold text-accent-gold'
                    : 'text-[var(--color-text-secondary)]',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {idx < STEPS.length - 1 && (
              <div
                className={[
                  'mx-2 mt-[-12px] h-[2px] w-12 sm:w-16 transition-colors',
                  done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]',
                ].join(' ')}
                aria-hidden
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
