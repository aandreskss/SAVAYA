'use client'

import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { CartItem as CartItemType } from '@/lib/types'
import { useCurrency } from '@/components/providers/CurrencyProvider'

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

interface CartItemProps {
  item: CartItemType
  onQuantityChange: (variantId: string, qty: number) => void
  onRemove: (variantId: string) => void
}

export default function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
  const currency = useCurrency()
  const isLowStock = item.stock != null && item.quantity >= item.stock

  return (
    <div className="flex gap-3 py-4 border-b border-gray-light last:border-0">
      {/* Image */}
      <div className="relative w-[60px] h-[80px] rounded overflow-hidden bg-gray-bg shrink-0">
        {item.image && (
          <Image src={item.image} alt={item.name} fill sizes="60px" className="object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="text-sm font-medium line-clamp-2 leading-snug">{item.name}</p>
        <p className="text-xs text-gray-text">
          {[item.size, item.color].filter(Boolean).join(' · ')}
        </p>
        <p className="text-sm font-heading font-semibold">{formatPrice(item.price, currency)}</p>
        {item.divisaPrice != null && (
          <p className="text-xs text-gray-text">
            Precio Divisa: <span className="font-semibold text-black">{formatPrice(item.divisaPrice, 'USD')}</span>
          </p>
        )}

        {isLowStock && (
          <p className="text-[11px] font-semibold text-sale">
            ¡Solo {item.stock} disponible{item.stock !== 1 ? 's' : ''}!
          </p>
        )}

        {/* Quantity + delete */}
        <div className="flex items-center justify-between mt-auto pt-0.5">
          <div className="flex items-center border border-gray-light rounded overflow-hidden">
            <button
              type="button"
              onClick={() => onQuantityChange(item.variantId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Disminuir cantidad"
              className="w-7 h-7 flex items-center justify-center text-base hover:bg-gray-bg disabled:opacity-30 transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center text-sm select-none">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.variantId, item.quantity + 1)}
              disabled={item.stock != null && item.quantity >= item.stock}
              aria-label="Aumentar cantidad"
              className="w-7 h-7 flex items-center justify-center text-base hover:bg-gray-bg disabled:opacity-30 transition-colors"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.variantId)}
            aria-label={`Eliminar ${item.name}`}
            className="p-1.5 text-gray-text hover:text-sale transition-colors"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
