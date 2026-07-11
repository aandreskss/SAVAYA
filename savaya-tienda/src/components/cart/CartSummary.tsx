'use client'

import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from '@/lib/constants'
import Button from '@/components/ui/Button'
import { useCurrency } from '@/components/providers/CurrencyProvider'

interface CartSummaryProps {
  subtotal: number
  discount?: number
  onCheckout?: () => void
}

export default function CartSummary({ subtotal, discount = 0, onCheckout }: CartSummaryProps) {
  const currency = useCurrency()
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal - discount + shipping
  const bcvNote = currency === 'USD' ? 'Precios en dólares · Tasa DÓLAR BCV' : 'Precios en euros · Tasa EURO BCV'

  return (
    <div className="bg-gray-bg rounded p-6 flex flex-col gap-4">
      <p className="font-heading font-semibold text-base">Resumen del pedido</p>
      <div className="flex flex-col gap-2 text-sm">
        <Row label="Subtotal" value={formatPrice(subtotal, currency)} />
        {discount > 0 && <Row label="Descuento" value={`-${formatPrice(discount, currency)}`} className="text-sale" />}
        <Row
          label="Envío"
          value={shipping === 0 ? 'Gratis' : formatPrice(shipping, currency)}
          sub={shipping > 0 ? `Gratis desde ${formatPrice(FREE_SHIPPING_THRESHOLD, currency)}` : undefined}
        />
        <div className="border-t border-gray-light pt-3 flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>{formatPrice(total, currency)}</span>
        </div>
        <p className="text-[10px] text-gray-text text-right">{bcvNote}</p>
      </div>
      {onCheckout ? (
        <Button size="lg" className="w-full" onClick={onCheckout}>Ir al checkout</Button>
      ) : (
        <Link href="/checkout">
          <Button size="lg" className="w-full">Ir al checkout</Button>
        </Link>
      )}
    </div>
  )
}

function Row({ label, value, sub, className }: { label: string; value: string; sub?: string; className?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-text">{label}{sub && <span className="block text-xs">{sub}</span>}</span>
      <span className={className}>{value}</span>
    </div>
  )
}
