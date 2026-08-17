'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { QuantityStepper, Badge } from '@/shared/ui'
import { formatPrice } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { CartItemDetail } from '../repository'
import { removeFromCart, updateCartItemQuantity } from '../actions'
import { useCartStore } from '../cart-store'

// ---------------------------------------------------------------------------
// CartItem — single item row for CartDrawer / CartPageClient
// ---------------------------------------------------------------------------

type Props = {
  item: CartItemDetail
  /** larger = true in cart page, false in drawer */
  large?: boolean
}

export function CartItem({ item, large = false }: Props) {
  const setSummary = useCartStore((s) => s.setSummary)
  const [isPending, startTransition] = useTransition()
  const [removePending, setRemovePending] = useState(false)

  function handleQuantityChange(newQty: number) {
    startTransition(async () => {
      const result = await updateCartItemQuantity(item.cartItemId, newQty)
      if (result.success) setSummary(result.data)
    })
  }

  function handleRemove() {
    setRemovePending(true)
    startTransition(async () => {
      const result = await removeFromCart(item.cartItemId)
      if (result.success) setSummary(result.data)
      setRemovePending(false)
    })
  }

  const imgSize = large ? 80 : 60

  return (
    <div
      className={cn(
        'flex gap-3 py-3',
        !item.isAvailable && 'opacity-60',
        (isPending || removePending) && 'opacity-40 pointer-events-none',
      )}
    >
      {/* Thumbnail */}
      <div
        className="shrink-0 rounded-[16px] overflow-hidden bg-surface-2 border border-border"
        style={{ width: imgSize, height: imgSize }}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.imageAlt ?? item.productName}
            width={imgSize}
            height={imgSize}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-border" aria-hidden="true" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-sans text-sm font-medium text-text-primary leading-snug truncate">
              {item.productName}
            </p>
            <p className="font-sans text-xs text-text-secondary">
              {item.color.name} · Talla {item.size.name}
            </p>
          </div>
          {/* Remove button */}
          <button
            type="button"
            aria-label={`Eliminar ${item.productName} del carrito`}
            onClick={handleRemove}
            disabled={removePending || isPending}
            className={cn(
              'shrink-0 h-7 w-7 flex items-center justify-center rounded-sm',
              'text-text-secondary hover:text-error hover:bg-error/10',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
            )}
          >
            <TrashIcon />
          </button>
        </div>

        {/* Sin stock badge */}
        {!item.isAvailable && (
          <Badge variant="error" size="sm">
            Sin stock
          </Badge>
        )}

        {/* Quantity + price row */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <QuantityStepper
            value={item.quantity}
            min={1}
            max={item.availableStock > 0 ? item.availableStock : item.quantity}
            onChange={handleQuantityChange}
            disabled={!item.isAvailable || isPending}
          />
          <span className="font-sans text-sm font-semibold text-text-primary">
            {formatPrice(item.totalPriceUsd)}
          </span>
        </div>

        {item.compareAtPrice !== null && item.compareAtPrice > item.unitPriceUsd && (
          <p className="font-sans text-xs text-text-secondary line-through">
            {formatPrice(item.compareAtPrice * item.quantity)}
          </p>
        )}
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M6 7v5M10 7v5M3 4l1 9h8l1-9"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
