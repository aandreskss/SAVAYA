'use client'

import Link from 'next/link'
import { Drawer, EmptyState, Skeleton } from '@/shared/ui'
import { formatPrice } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { useCartStore } from '../cart-store'
import { CartItem } from './CartItem'

// ---------------------------------------------------------------------------
// CartDrawer — right-side panel that opens on cart icon click
// Reads all state from useCartStore (no props needed).
// ---------------------------------------------------------------------------

export function CartDrawer() {
  const { isOpen, closeCart, summary } = useCartStore()

  const itemCount = summary?.itemCount ?? 0
  const items = summary?.items ?? []
  const subtotal = summary?.subtotalUsd ?? 0
  const hasUnavailable = summary?.hasUnavailableItems ?? false
  const isLoading = isOpen && summary === null

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeCart}
      title={`Tu carrito${itemCount > 0 ? ` (${itemCount})` : ''}`}
      side="right"
    >
      {isLoading ? (
        <CartSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BagEmptyIcon />}
          title="Tu carrito está vacío"
          description="Descubre nuestra colección y encuentra el par perfecto para ti."
          action={{
            label: 'Explorar productos',
            onClick: closeCart,
          }}
        />
      ) : (
        <div className="flex flex-col h-full">
          {/* Items list */}
          <ul className="flex-1 divide-y divide-border -mx-6 px-6 overflow-y-auto">
            {items.map((item) => (
              <li key={item.cartItemId}>
                <CartItem item={item} large={false} />
              </li>
            ))}
          </ul>

          {/* Sticky footer */}
          <div className="border-t border-border pt-4 mt-4 flex flex-col gap-3 shrink-0">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm text-text-secondary">Subtotal</span>
              <span className="font-sans text-base font-semibold text-text-primary">
                {formatPrice(subtotal)}
              </span>
            </div>

            <p className="font-sans text-xs text-text-secondary">
              Los precios incluyen impuestos donde aplica.
            </p>

            {/* CTAs */}
            <Link
              href="/carrito"
              onClick={closeCart}
              className={cn(
                'w-full py-2.5 rounded-sm border border-border',
                'font-sans text-sm font-medium text-center text-text-primary',
                'hover:bg-white/8 transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
              )}
            >
              Ver carrito
            </Link>

            <Link
              href="/checkout"
              onClick={closeCart}
              aria-disabled={hasUnavailable}
              className={cn(
                'w-full py-2.5 rounded-sm',
                'font-sans text-sm font-medium text-center',
                'transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                hasUnavailable
                  ? 'bg-border text-text-secondary cursor-not-allowed pointer-events-none'
                  : 'bg-accent-gold text-text-primary-inverse hover:bg-accent-gold-hover',
              )}
              tabIndex={hasUnavailable ? -1 : undefined}
            >
              Continuar
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  )
}

function CartSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 py-3">
          <Skeleton variant="rect" width={60} height={60} />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton variant="text" width="70%" height={14} />
            <Skeleton variant="text" width="40%" height={12} />
            <Skeleton variant="rect" width={120} height={36} />
          </div>
        </div>
      ))}
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
