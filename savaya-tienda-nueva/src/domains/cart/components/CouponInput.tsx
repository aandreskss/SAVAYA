'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/shared/lib/utils'
import { validateCouponAction } from '@/domains/discounts-promotions/actions'
import type { AppliedCoupon } from '@/domains/checkout/types'

type Props = {
  subtotalUsd: number
  appliedCoupon: AppliedCoupon | null
  onApply: (coupon: AppliedCoupon) => void
  onRemove: () => void
}

export function CouponInput({ subtotalUsd, appliedCoupon, onApply, onRemove }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleApply() {
    if (!code.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await validateCouponAction(code.trim(), subtotalUsd)
      if (result.valid) {
        onApply({
          code: code.trim().toUpperCase(),
          discountId: result.discountId,
          discountAmount: result.discountAmount,
        })
        setCode('')
      } else {
        setError(result.error)
      }
    })
  }

  if (appliedCoupon) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between rounded-md border border-success/40 bg-success/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span className="font-mono text-sm font-semibold tracking-wider text-text-primary">
              {appliedCoupon.code}
            </span>
            <span className="text-sm text-success font-medium">
              −${appliedCoupon.discountAmount.toFixed(2)}
            </span>
          </div>
          <button
            onClick={onRemove}
            className="text-xs text-text-secondary hover:text-error transition-colors ml-2"
            aria-label="Quitar código"
          >
            Quitar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="coupon-code"
        className="text-sm font-medium text-text-primary"
      >
        Código de descuento
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            if (error) setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Ej. SAVAYA10"
          disabled={isPending}
          className={cn(
            'flex-1 h-10 px-3 rounded-md border bg-surface text-sm text-text-primary',
            'placeholder:text-text-secondary/50',
            'focus:outline-none focus:border-accent-gold',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'font-mono tracking-wider',
            error ? 'border-error' : 'border-border',
          )}
          style={{ textTransform: 'uppercase' }}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={isPending || !code.trim()}
          className={cn(
            'h-10 px-4 rounded-md border border-border',
            'text-sm font-medium text-text-primary',
            'bg-surface hover:bg-surface-2 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {isPending ? '…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2.5 7L5.5 10L11.5 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-success"
      />
    </svg>
  )
}
