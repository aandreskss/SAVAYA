'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/lib/types'
import { useCurrency } from '@/components/providers/CurrencyProvider'

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

interface CartItemFullProps {
  item: CartItem
  onQuantityChange: (variantId: string, qty: number) => void
  onRemove: (variantId: string) => void
}

export default function CartItemFull({ item, onQuantityChange, onRemove }: CartItemFullProps) {
  const currency = useCurrency()
  const [savedFeedback, setSavedFeedback] = useState(false)

  function handleSaveForLater() {
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2500)
  }

  const itemSubtotal = item.price * item.quantity
  const isLowStock = item.stock != null && item.quantity >= item.stock

  return (
    <div className="flex gap-4 md:gap-6 py-6 border-b border-gray-light last:border-0">
      {/* Image */}
      <div className="relative w-[80px] h-[106px] md:w-[96px] md:h-[128px] rounded overflow-hidden bg-gray-bg shrink-0">
        {item.image && (
          <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top row: name + subtotal */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm md:text-base font-medium line-clamp-2 leading-snug">{item.name}</p>
            <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-gray-text">
              {item.size && (
                <span>Talla: <span className="text-black font-medium">{item.size}</span></span>
              )}
              {item.color && (
                <span>Color: <span className="text-black font-medium">{item.color}</span></span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-heading font-bold text-sm md:text-base">{formatPrice(itemSubtotal, currency)}</p>
            {item.quantity > 1 && (
              <p className="text-[11px] text-gray-text mt-0.5">{formatPrice(item.price, currency)} c/u</p>
            )}
          </div>
        </div>

        {/* Low stock warning */}
        {isLowStock && (
          <p className="text-xs font-semibold text-sale mt-2">
            ¡Solo {item.stock} disponible{item.stock !== 1 ? 's' : ''}!
          </p>
        )}

        {/* Bottom row: quantity + actions */}
        <div className="flex items-center justify-between mt-auto pt-4">
          {/* Quantity stepper */}
          <div className="flex items-center border border-gray-light rounded overflow-hidden">
            <button
              type="button"
              onClick={() => onQuantityChange(item.variantId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Disminuir cantidad"
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-base hover:bg-gray-bg disabled:opacity-30 transition-colors"
            >
              −
            </button>
            <span className="w-9 md:w-10 text-center text-sm select-none">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.variantId, item.quantity + 1)}
              disabled={item.stock != null && item.quantity >= item.stock}
              aria-label="Aumentar cantidad"
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-base hover:bg-gray-bg disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 text-xs">
            {savedFeedback ? (
              <span className="text-accent font-medium">Inicia sesión para guardar</span>
            ) : (
              <button
                type="button"
                onClick={handleSaveForLater}
                className="text-gray-text hover:text-black underline underline-offset-2 transition-colors"
              >
                Guardar para después
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.variantId)}
              aria-label={`Eliminar ${item.name}`}
              className="text-gray-text hover:text-sale transition-colors p-0.5"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
