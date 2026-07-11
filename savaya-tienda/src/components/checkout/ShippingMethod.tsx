'use client'

import { formatPrice, cn } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '@/lib/constants'
import type { ShippingMethodType } from '@/lib/types'
import { useCurrency } from '@/components/providers/CurrencyProvider'

interface ShippingMethodProps {
  selected: ShippingMethodType
  subtotal: number
  deliveryType: 'office' | 'home' | 'store'
  shippingCost?: number | null
  onChange: (method: ShippingMethodType) => void
  onContinue: () => void
  onBack: () => void
  loading?: boolean
}

export default function ShippingMethod({ subtotal, deliveryType, shippingCost: propCost, onContinue, onBack, loading }: ShippingMethodProps) {
  const currency = useCurrency()
  const fallbackFree = subtotal >= FREE_SHIPPING_THRESHOLD
  const fallbackCost = fallbackFree ? 0 : SHIPPING_COST
  const resolvedCost = propCost !== undefined && propCost !== null ? propCost : fallbackCost

  const option = {
    office: {
      label: 'Envío estándar por agencia',
      description: '3–5 días hábiles · Zoom, Tealca o MRW',
      cost: resolvedCost,
      badge: resolvedCost === 0 ? '¡Envío gratis!' : null,
      note: resolvedCost > 0 ? `Precio calculado según la ciudad de destino` : null,
    },
    home: {
      label: 'Delivery a domicilio',
      description: 'Disponible solo si vives en Valencia (Carabobo)',
      cost: resolvedCost,
      badge: resolvedCost === 0 ? '¡Gratis!' : null,
      note: 'Coordinamos el horario de entrega por WhatsApp',
    },
    store: {
      label: 'Retiro y pago en tienda',
      description: 'Visítanos y lleva tu pedido el mismo día',
      cost: 0,
      badge: '¡Gratis!',
      note: 'Deberás apartar un porcentaje del total al confirmar',
    },
  }[deliveryType]

  return (
    <div>
      <h2 className="font-display text-xl font-bold mb-6">Tipo de envío</h2>

      <div className="flex flex-col gap-3 mb-8">
        <div className="flex items-start gap-4 border-2 border-black rounded-lg p-4 bg-white">
          <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-black" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold">{option.label}</p>
              {option.badge && (
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  {option.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-text mt-0.5">{option.description}</p>
            {option.note && <p className="text-[11px] text-gray-text mt-1">{option.note}</p>}
          </div>

          <p className={cn(
            'font-heading font-bold text-sm shrink-0 mt-0.5',
            option.cost === 0 ? 'text-green-600' : '',
          )}>
            {option.cost === 0 ? 'Gratis' : formatPrice(option.cost, currency)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onContinue}
          disabled={loading}
          className="w-full py-4 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors disabled:opacity-60"
        >
          {loading ? 'PROCESANDO...' : 'CONTINUAR AL PAGO →'}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="w-full py-3 text-sm text-gray-text hover:text-black transition-colors disabled:opacity-40"
        >
          ← Volver a información de envío
        </button>
      </div>
    </div>
  )
}
