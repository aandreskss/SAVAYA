'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EmptyState, Badge } from '@/shared/ui'
import { formatPrice } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useCartStore } from '../cart-store'
import { useCheckoutStore } from '@/domains/checkout/checkout-store'
import { CartItem } from './CartItem'
import { CouponInput } from './CouponInput'
import type { CartSummary } from '../repository'
import type { AppliedCoupon } from '@/domains/checkout/types'

// ---------------------------------------------------------------------------
// CartPageClient
// Two-column layout on desktop, stacked on mobile.
// ---------------------------------------------------------------------------

type Props = {
  initialSummary: CartSummary
  /** Pre-calculated VES equivalent of the subtotal */
  subtotalVes: number
}

export function CartPageClient({ initialSummary, subtotalVes }: Props) {
  const router = useRouter()
  const storeSummary = useCartStore((s) => s.summary)
  const setSummary = useCartStore((s) => s.setSummary)
  const appliedCoupon = useCheckoutStore((s) => s.appliedCoupon)
  const setAppliedCoupon = useCheckoutStore((s) => s.setAppliedCoupon)

  // Use store summary if available (reflects latest cart actions),
  // otherwise fall back to the SSR initial value.
  const summary = storeSummary ?? initialSummary

  // Hydrate store with initial SSR data on first render
  useState(() => {
    if (!storeSummary) setSummary(initialSummary)
  })

  const { items, subtotalUsd, hasUnavailableItems } = summary
  const canCheckout = items.length > 0 && !hasUnavailableItems
  const discountAmount = appliedCoupon?.discountAmount ?? 0
  const displayTotal = Math.max(0, subtotalUsd - discountAmount)

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<BagEmptyIcon />}
          title="Tu carrito está vacío"
          description="Descubre nuestra colección y encuentra el par perfecto para ti."
          action={{
            label: 'Explorar productos',
            onClick: () => router.push('/'),
          }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <h1 className="font-display text-2xl md:text-3xl font-medium text-text-primary mb-8">
        Tu carrito
      </h1>

      {/* Unavailable warning banner */}
      {hasUnavailableItems && (
        <div className="mb-6 p-4 rounded-sm bg-error/10 border border-error/20">
          <p className="font-sans text-sm text-error font-medium">
            Algunos productos ya no están disponibles. Retíralos para continuar.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Left column — items (60%) */}
        <div className="flex-1 w-full">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.cartItemId}>
                <CartItem item={item} large={true} />
              </li>
            ))}
          </ul>
        </div>

        {/* Right column — order summary (40%) */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0">
          <div className="bg-surface-2 rounded-[28px] p-7 flex flex-col gap-4 sticky top-24">
            <h2 className="font-sans text-sm font-extrabold uppercase tracking-widest text-text-primary">
              Resumen
            </h2>

            {/* Price breakdown */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-sans text-sm text-text-secondary">Subtotal</span>
                <span className="font-sans text-sm font-medium text-text-primary">
                  {formatPrice(subtotalUsd)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-success">Descuento</span>
                  <span className="font-sans text-sm font-medium text-success">
                    −{formatPrice(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-sans text-sm text-text-secondary">Envío</span>
                <span className="font-sans text-sm text-text-secondary italic">
                  Se calcula en el checkout
                </span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-sans text-sm font-semibold text-text-primary">Total</span>
                <span className="font-sans text-base font-bold text-text-primary">
                  {formatPrice(displayTotal)}
                </span>
              </div>
              <p className="font-sans text-xs text-text-secondary">
                ≈ Bs.{' '}
                {new Intl.NumberFormat('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(subtotalVes * (displayTotal / (subtotalUsd || 1)))}
              </p>
            </div>

            {/* Coupon input */}
            <CouponInput
              subtotalUsd={subtotalUsd}
              appliedCoupon={appliedCoupon}
              onApply={(coupon: AppliedCoupon) => setAppliedCoupon(coupon)}
              onRemove={() => setAppliedCoupon(null)}
            />

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              aria-disabled={!canCheckout}
              className={cn(
                'w-full py-3 rounded-sm text-center',
                'font-sans text-sm font-semibold',
                'transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                canCheckout
                  ? 'bg-accent-gold text-text-primary-inverse hover:bg-accent-gold-hover'
                  : 'bg-border text-text-secondary cursor-not-allowed pointer-events-none',
              )}
              tabIndex={!canCheckout ? -1 : undefined}
            >
              Ir al checkout
            </Link>

            {/* Payment methods */}
            <div className="flex flex-col gap-2">
              <p className="font-sans text-xs text-text-secondary text-center">
                Métodos de pago aceptados
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Zelle', 'Pago Móvil', 'USDT', 'Binance'].map((method) => (
                  <Badge key={method} variant="outline" size="sm">
                    {method}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BagEmptyIcon() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M10 13h20l3 20H7l3-20Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 13v-3a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
