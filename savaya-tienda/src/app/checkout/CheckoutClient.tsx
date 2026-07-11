'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import type { CheckoutStep, PaymentMethod, ShippingMethodType, PaymentConfigDB, ShippingPrices } from '@/lib/types'
import { SHIPPING_COST, EXPRESS_SHIPPING_COST, FREE_SHIPPING_THRESHOLD, CASH_ON_DELIVERY_COST } from '@/lib/constants'
import CheckoutSteps from '@/components/checkout/CheckoutSteps'
import ShippingForm, { type ShippingFormData } from '@/components/checkout/ShippingForm'
import ShippingMethod from '@/components/checkout/ShippingMethod'
import PaymentForm from '@/components/checkout/PaymentForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import { CurrencyProvider } from '@/components/providers/CurrencyProvider'

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

interface Props {
  paymentConfig?: PaymentConfigDB | null
  enabledMethods?: string[] | null
  enabledShippingCompanies?: string[] | null
  shippingPrices?: ShippingPrices | null
  storeCurrency?: string
  bcvRate?: number | null
  whatsappNumber?: string
  wholesaleMinQty?: number
}

export default function CheckoutClient({ paymentConfig, enabledMethods, enabledShippingCompanies, shippingPrices, storeCurrency = 'EUR', bcvRate, whatsappNumber = '', wholesaleMinQty = 6 }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const items = useCartStore((s) => s.items)
  const discount = useCartStore((s) => s.discount)
  const clearCart = useCartStore((s) => s.clearCart)

  const [step, setStep] = useState<CheckoutStep>('shipping')
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null)
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodType>('standard')
  const [submitting, setSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (mounted && items.length === 0 && !orderPlaced) {
      router.replace('/carrito')
    }
  }, [mounted, items.length, router, orderPlaced])

  if (!mounted || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0)
  const isWholesale = totalQuantity >= wholesaleMinQty
  const subtotal = items.reduce((sum, i) => {
    const p = isWholesale && i.wholesalePrice != null ? i.wholesalePrice : i.price
    return sum + p * i.quantity
  }, 0)
  const discountAmount = discount?.amount ?? 0

  // Dynamic shipping cost lookup from configured prices
  function getDynamicShippingCost(): number | null {
    if (!shippingData || !shippingPrices) return null
    const city = shippingData.city?.trim()
    if (!city) return null

    if (shippingData.delivery_type === 'office') {
      const company = shippingData.shipping_company?.toLowerCase()
      if (!company || !shippingPrices.agency) return null
      return shippingPrices.agency[company] !== undefined ? shippingPrices.agency[company] : null
    }
    if (shippingData.delivery_type === 'home') {
      if (!shippingPrices.delivery) return null
      return shippingPrices.delivery[city] !== undefined ? shippingPrices.delivery[city] : null
    }
    return null
  }

  const resolvedShippingCost = (() => {
    if (step === 'shipping') return null
    if (shippingMethod === 'pickup') return 0
    if (shippingMethod === 'express') return EXPRESS_SHIPPING_COST

    // Try configured price first
    const dynamic = getDynamicShippingCost()
    if (dynamic !== null) return dynamic

    // Fallback to constants
    const free = subtotal >= FREE_SHIPPING_THRESHOLD
    if (shippingMethod === 'cash_on_delivery') return free ? 0 : CASH_ON_DELIVERY_COST
    return free ? 0 : SHIPPING_COST
  })()

  const total = subtotal - discountAmount + (resolvedShippingCost ?? 0)

  async function handlePlaceOrder(paymentMethod: PaymentMethod, reservationPct?: number) {
    if (!shippingData) return
    setSubmitting(true)
    setPaymentError('')

    const reservationAmount = reservationPct ? Math.round(total * reservationPct) / 100 : null

    try {
      const DIVISA_METHODS = ['zelle', 'binance', 'usdt']
      const hasDivisa = items.some(i => i.divisaPrice != null || i.wholesaleDivisaPrice != null)
      const divisaTotal = hasDivisa
        ? items.reduce((s, i) => {
            const dp = isWholesale && i.wholesaleDivisaPrice != null
              ? i.wholesaleDivisaPrice
              : (i.divisaPrice ?? (isWholesale && i.wholesalePrice != null ? i.wholesalePrice : i.price))
            return s + dp * i.quantity
          }, 0)
        : null

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            name: i.name,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
            unitPrice: i.price,
            imageUrl: i.image,
          })),
          shippingAddress: shippingData,
          shippingMethod,
          shippingCost: resolvedShippingCost ?? 0,
          subtotal,
          discountCode: discount?.code ?? null,
          discountAmount,
          total,
          paymentMethod,
          reservationPct: reservationPct ?? null,
          reservationAmount,
          divisaTotal: DIVISA_METHODS.includes(paymentMethod) ? (divisaTotal ?? null) : null,
        }),
      })

      const data: { orderId?: string; orderNumber?: string; redirectUrl?: string; error?: string } = await res.json()

      if (!res.ok || data.error) {
        setPaymentError(data.error ?? 'Ocurrió un error. Inténtalo de nuevo.')
        return
      }

      setOrderPlaced(true)
      clearCart()

      if (paymentMethod === 'wholesale_whatsapp') {
        const itemsList = items.map(i => `• ${i.name} (Talla ${i.size || 'única'} x${i.quantity})`).join('\n')
        const msg = encodeURIComponent(
          `¡Hola! Quiero coordinar mi pedido al mayor 🛍️\n\n` +
          `*Pedido: ${data.orderNumber}*\n` +
          `Total: *${formatPrice(total, storeCurrency)}* · ${totalQuantity} pares\n\n` +
          `Productos:\n${itemsList}\n\n` +
          `¿Cuáles son los métodos de pago disponibles?`
        )
        const wa = whatsappNumber.replace(/\D/g, '')
        if (wa) window.open(`https://wa.me/${wa}?text=${msg}`, '_blank')
        router.push(`/pedido/${data.orderId}`)
        return
      }

      if (reservationPct && shippingMethod === 'pickup') {
        router.push(`/pedido/${data.orderId}/verificar-pago?pct=${reservationPct}`)
      } else if (paymentMethod === 'efectivo') {
        router.push(`/pedido/${data.orderId}`)
      } else {
        router.push(`/pedido/${data.orderId}/verificar-pago`)
      }
    } catch {
      setPaymentError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CurrencyProvider currency={storeCurrency}>
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-light">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Savaya — inicio">
            <Image src="/logo.png" alt="Savaya" width={44} height={44} className="h-11 w-11 object-contain" />
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-text">
            <LockIcon />
            Compra segura
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <CheckoutSteps current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-14 items-start">
          {/* Left: step content */}
          <div>
            {step === 'shipping' && (
              <ShippingForm
                defaultValues={shippingData ?? undefined}
                enabledCompanies={enabledShippingCompanies}
                shippingPrices={shippingPrices}
                onSubmit={(data) => {
                  setShippingData(data)
                  const autoMethod =
                    data.delivery_type === 'home' ? 'delivery' :
                    data.delivery_type === 'store' ? 'pickup' :
                    'standard'
                  setShippingMethod(autoMethod)
                  setStep('method')
                }}
              />
            )}

            {step === 'method' && (
              <ShippingMethod
                selected={shippingMethod}
                subtotal={subtotal}
                deliveryType={shippingData?.delivery_type ?? 'office'}
                shippingCost={resolvedShippingCost}
                onChange={setShippingMethod}
                loading={false}
                onContinue={() => setStep('payment')}
                onBack={() => setStep('shipping')}
              />
            )}

            {step === 'payment' && shippingData && (
              <PaymentForm
                shippingData={shippingData}
                shippingMethod={shippingMethod}
                total={total}
                loading={submitting}
                error={paymentError}
                onBack={() => setStep('method')}
                onSubmit={handlePlaceOrder}
                paymentConfig={paymentConfig}
                enabledMethods={enabledMethods}
                items={items}
                bcvRate={bcvRate}
                isWholesale={isWholesale}
                totalQuantity={totalQuantity}
              />
            )}
          </div>

          {/* Right: sticky summary */}
          <div className="lg:sticky lg:top-6">
            <OrderSummary
              items={items}
              discountAmount={discountAmount}
              shippingCost={resolvedShippingCost}
              bcvRate={bcvRate}
              isWholesale={isWholesale}
            />
          </div>
        </div>
      </main>
    </div>
    </CurrencyProvider>
  )
}
