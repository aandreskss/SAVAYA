'use client'

import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { formatBs } from '@/lib/bcvRate'
import type { CartItem } from '@/lib/types'
import { useCurrency } from '@/components/providers/CurrencyProvider'

interface OrderSummaryProps {
  items: CartItem[]
  discountAmount?: number
  shippingCost: number | null
  bcvRate?: number | null
  isWholesale?: boolean
}

function effectivePrice(item: CartItem, wholesale: boolean): number {
  return wholesale && item.wholesalePrice != null ? item.wholesalePrice : item.price
}

function effectiveDivisaPrice(item: CartItem, wholesale: boolean): number | null {
  if (wholesale && item.wholesaleDivisaPrice != null) return item.wholesaleDivisaPrice
  return item.divisaPrice ?? null
}

export default function OrderSummary({ items, discountAmount = 0, shippingCost, bcvRate, isWholesale = false }: OrderSummaryProps) {
  const currency = useCurrency()
  const subtotal = items.reduce((sum, i) => sum + effectivePrice(i, isWholesale) * i.quantity, 0)
  const total = subtotal - discountAmount + (shippingCost ?? 0)
  const bcvNote = currency === 'USD' ? 'Precios en dólares · Tasa DÓLAR BCV' : 'Precios en euros · Tasa EURO BCV'

  return (
    <div className="border border-gray-light rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-light bg-gray-bg">
        <h2 className="font-heading font-bold text-sm">Resumen del pedido</h2>
      </div>

      {/* Items */}
      <div className="px-5 py-4 flex flex-col gap-4 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-3">
            <div className="relative w-14 h-[72px] rounded bg-gray-bg shrink-0 overflow-hidden">
              {item.image && (
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              )}
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className="text-xs font-medium line-clamp-2 leading-snug">{item.name}</p>
              <p className="text-[11px] text-gray-text">{item.size} · {item.color}</p>
              <p className="text-xs font-semibold mt-auto">{formatPrice(effectivePrice(item, isWholesale) * item.quantity, currency)}</p>
              {effectiveDivisaPrice(item, isWholesale) != null && (
                <p className="text-[11px] text-gray-text">
                  Divisa: <span className="font-semibold text-black">{formatPrice(effectiveDivisaPrice(item, isWholesale)! * item.quantity, 'USD')}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="px-5 py-4 border-t border-gray-light flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-gray-text">
          <span>Subtotal</span>
          <span className="text-black font-medium">{formatPrice(subtotal, currency)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sale font-medium">
            <span>Descuento</span>
            <span>−{formatPrice(discountAmount, currency)}</span>
          </div>
        )}
        <div className="flex justify-between items-start text-gray-text">
          <span>Envío</span>
          {shippingCost === null ? (
            <span className="text-[11px] text-gray-text text-right leading-snug">
              Se calcula en<br className="hidden sm:block" /> el paso 2
            </span>
          ) : shippingCost === 0 ? (
            <span className="text-green-600 font-medium">Gratis</span>
          ) : (
            <span className="text-black font-medium">{formatPrice(shippingCost, currency)}</span>
          )}
        </div>
        <div className="flex justify-between font-heading font-bold text-base border-t border-gray-light pt-3 mt-1">
          <span>Total</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
        {bcvRate != null && (
          <div className="flex justify-between items-center text-xs text-gray-text">
            <span>Equivalente en Bs.</span>
            <span className="font-semibold text-black">{formatBs(total, bcvRate)}</span>
          </div>
        )}
        <p className="text-[10px] text-gray-text text-right">{bcvNote}</p>
        {items.some(i => i.divisaPrice != null || i.wholesaleDivisaPrice != null) && (() => {
          const divisaSubtotal = items.reduce((s, i) => s + (effectiveDivisaPrice(i, isWholesale) ?? effectivePrice(i, isWholesale)) * i.quantity, 0)
          const savings = total - divisaSubtotal
          return (
            <div className="rounded-lg overflow-hidden border-2 border-green-500 mt-1">
              {/* Savings header */}
              <div className="bg-green-500 px-4 py-2.5 text-white text-center">
                <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-green-100 mb-0.5">
                  💵 Paga en Zelle · USDT · Binance
                </p>
                {savings > 0 && (
                  <p className="text-lg font-display font-bold leading-tight">
                    ¡Ahorra {formatPrice(savings, 'USD')}!
                  </p>
                )}
              </div>
              {/* Divisa total */}
              <div className="bg-green-50 px-4 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-heading font-semibold text-green-700">Total en divisa</span>
                  <span className="text-xl font-heading font-bold text-green-800">{formatPrice(divisaSubtotal, 'USD')}</span>
                </div>
                {savings > 0 && (
                  <p className="text-[11px] text-green-600 mt-1 text-right">
                    vs {formatPrice(total, currency)} con transferencia o pago móvil
                  </p>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
