'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'
import type { Product } from '@/lib/types'
import { formatPrice, cn } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'
import CartItemFull from './CartItemFull'
import ProductGrid from '@/components/product/ProductGrid'

// ─── Icons ────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EmptyBagIcon() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-text/25">
      <path d="M24 18L12 34v52a6 6 0 0 0 6 6h60a6 6 0 0 0 6-6V34L72 18z" />
      <line x1="12" y1="34" x2="84" y2="34" />
      <path d="M64 46a16 16 0 0 1-32 0" />
    </svg>
  )
}

// ─── Payment method badges ────────────────────────────────────────────────────

function VisaBadge() {
  return (
    <div className="h-7 px-2.5 rounded bg-[#1A1F71] text-white text-[11px] font-bold italic flex items-center tracking-wide">
      VISA
    </div>
  )
}

function MastercardBadge() {
  return (
    <div className="h-7 w-12 rounded bg-gray-100 flex items-center justify-center relative overflow-visible px-1">
      <div className="relative w-8 h-5 flex items-center">
        <div className="absolute left-0 w-5 h-5 rounded-full bg-[#EB001B]" />
        <div className="absolute left-3 w-5 h-5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </div>
    </div>
  )
}

function TextBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <div
      style={{ backgroundColor: bg, color }}
      className="h-7 px-2.5 rounded text-[11px] font-bold flex items-center whitespace-nowrap"
    >
      {label}
    </div>
  )
}

// ─── Empty cart ───────────────────────────────────────────────────────────────

function EmptyCart() {
  return (
    <main>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-20 md:py-32 flex flex-col items-center text-center gap-7">
        <EmptyBagIcon />
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-3">Tu carrito está vacío</h1>
          <p className="text-gray-text leading-relaxed max-w-sm mx-auto">
            Aún no has agregado productos. ¡Explora nuestras colecciones y encuentra algo que te encante!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-1">
          <Link
            href="/nuevas-colecciones"
            className="px-8 py-3.5 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors"
          >
            NUEVAS COLECCIONES
          </Link>
          <Link
            href="/descuentos"
            className="px-8 py-3.5 border-2 border-black font-heading font-bold text-sm tracking-widest rounded hover:bg-black hover:text-white transition-colors"
          >
            VER DESCUENTOS
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CartSkeleton() {
  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-14">
        <div className="h-9 w-72 bg-gray-bg rounded animate-pulse mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-14">
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-6 py-6 border-b border-gray-light">
                <div className="w-24 h-32 bg-gray-bg rounded animate-pulse shrink-0" />
                <div className="flex-1 space-y-3 pt-1">
                  <div className="h-4 bg-gray-bg rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-bg rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-gray-bg rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-[480px] bg-gray-bg rounded animate-pulse" />
        </div>
      </div>
    </main>
  )
}

// ─── Order summary panel ──────────────────────────────────────────────────────

import type { CartDiscount } from '@/store/cartStore'
import { useWholesaleMinQty } from '@/components/providers/WholesaleProvider'
import { useCurrency } from '@/components/providers/CurrencyProvider'
import { computeWholesaleSubtotal, isWholesaleActive } from '@/lib/wholesale'

interface OrderSummaryPanelProps {
  subtotal: number
  appliedDiscount: CartDiscount | null
  estimatedTotal: number
  discountCode: string
  discountError: string
  discountLoading: boolean
  wholesaleActive: boolean
  onCodeChange: (v: string) => void
  onApplyDiscount: (e: React.FormEvent) => void
  onRemoveDiscount: () => void
}

function OrderSummaryPanel({
  subtotal,
  appliedDiscount,
  estimatedTotal,
  discountCode,
  discountError,
  discountLoading,
  wholesaleActive,
  onCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
}: OrderSummaryPanelProps) {
  const currency = useCurrency()
  const discountAmount = appliedDiscount?.amount ?? 0

  return (
    <div className="border border-gray-light rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-light bg-gray-bg">
        <h2 className="font-heading font-bold text-base">Resumen del pedido</h2>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5">
        {/* Wholesale badge */}
        {wholesaleActive && (
          <div className="flex items-center gap-2 bg-gold/10 border border-gold/30 rounded px-3 py-2.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8B6914] shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-xs font-heading font-semibold text-[#8B6914]">Descuento por compra al por mayor aplicado</p>
          </div>
        )}

        {/* Totals */}
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-text">Subtotal</span>
            <span className="font-medium">{formatPrice(subtotal, currency)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sale font-medium">
              <span>Descuento</span>
              <span>−{formatPrice(discountAmount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between items-start">
            <span className="text-gray-text">Envío</span>
            <Link
              href="/checkout"
              className="text-xs text-accent underline underline-offset-2 hover:text-black transition-colors text-right"
            >
              Calcular en el<br className="hidden sm:block" /> siguiente paso →
            </Link>
          </div>
          <div className="flex justify-between font-heading font-bold text-base border-t border-gray-light pt-3 mt-1">
            <span>Total estimado</span>
            <span>{formatPrice(estimatedTotal, currency)}</span>
          </div>
          {subtotal < FREE_SHIPPING_THRESHOLD && (
            <p className="text-xs text-gray-text">
              Agrega{' '}
              <span className="font-semibold text-black">
                {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal, currency)}
              </span>{' '}
              más para obtener envío gratis
            </p>
          )}
        </div>

        {/* Discount code */}
        <div>
          <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text mb-2.5">
            Código de descuento
          </p>
          {appliedDiscount ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-green-800 truncate">{appliedDiscount.label}</p>
                <p className="text-xs text-green-600">−{formatPrice(discountAmount, currency)} aplicado</p>
              </div>
              <button
                type="button"
                onClick={onRemoveDiscount}
                aria-label="Quitar código de descuento"
                className="ml-3 text-green-700 hover:text-green-900 shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={onApplyDiscount} className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO"
                  autoCapitalize="characters"
                  className={cn(
                    'flex-1 min-w-0 border rounded px-3 py-2.5 text-sm uppercase tracking-widest',
                    'placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-text/60',
                    'focus:outline-none transition-colors',
                    discountError ? 'border-sale focus:border-sale' : 'border-gray-light focus:border-black',
                  )}
                />
                <button
                  type="submit"
                  disabled={!discountCode.trim() || discountLoading}
                  className="px-4 py-2.5 bg-black text-white text-sm font-heading font-semibold rounded hover:bg-accent transition-colors disabled:opacity-40 shrink-0"
                >
                  {discountLoading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : (
                    'Aplicar'
                  )}
                </button>
              </form>
              {discountError && (
                <p className="text-xs text-sale mt-1.5">{discountError}</p>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/checkout"
          className="block w-full py-4 bg-black text-white text-sm font-heading font-bold tracking-widest text-center rounded hover:bg-accent transition-colors"
        >
          PROCEDER AL PAGO
        </Link>

        {/* Security */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-text">
          <LockIcon />
          Compra 100% segura y protegida
        </div>

        {/* Payment methods */}
        <div className="border-t border-gray-light pt-4">
          <p className="text-[10px] text-gray-text text-center mb-3 uppercase tracking-widest">
            Métodos de pago
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <VisaBadge />
            <MastercardBadge />
            <TextBadge label="PSE" bg="#007E3C" color="#FFFFFF" />
            <TextBadge label="Efecty" bg="#F5A623" color="#000000" />
            <TextBadge label="Mercado Pago" bg="#009EE3" color="#FFFFFF" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page component ──────────────────────────────────────────────────────

interface CartPageClientProps {
  suggestions: Product[]
}

export default function CartPageClient({ suggestions }: CartPageClientProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const appliedDiscount = useCartStore((s) => s.discount)
  const setDiscount = useCartStore((s) => s.setDiscount)
  const clearDiscount = useCartStore((s) => s.clearDiscount)

  const [discountCode, setDiscountCode] = useState('')
  const [discountError, setDiscountError] = useState('')
  const [discountLoading, setDiscountLoading] = useState(false)

  const wholesaleMinQty = useWholesaleMinQty()
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = computeWholesaleSubtotal(items, wholesaleMinQty)
  const wholesaleActive = isWholesaleActive(items, wholesaleMinQty)
  const estimatedTotal = subtotal - (appliedDiscount?.amount ?? 0)

  async function applyDiscount(e: React.FormEvent) {
    e.preventDefault()
    if (!discountCode.trim()) return
    setDiscountLoading(true)
    setDiscountError('')
    try {
      const res = await fetch('/api/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim().toUpperCase(), subtotal }),
      })
      const data: { valid: boolean; label?: string; discountAmount?: number; error?: string } =
        await res.json()
      if (data.valid && data.label && data.discountAmount != null) {
        setDiscount({
          code: discountCode.trim().toUpperCase(),
          label: data.label,
          amount: data.discountAmount,
        })
        setDiscountCode('')
      } else {
        setDiscountError(data.error ?? 'Código no válido.')
      }
    } catch {
      setDiscountError('Error al validar el código. Inténtalo de nuevo.')
    } finally {
      setDiscountLoading(false)
    }
  }

  if (!mounted) return <CartSkeleton />
  if (items.length === 0) return <EmptyCart />

  // Filter suggestions to exclude products already in cart
  const cartProductIds = new Set(items.map((i) => i.productId))
  const filteredSuggestions = suggestions
    .filter((p) => !cartProductIds.has(p.id))
    .slice(0, 4)

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-14">

        <h1 className="font-display text-2xl md:text-3xl font-bold mb-8 md:mb-10">
          Mi carrito{' '}
          <span className="text-gray-text font-normal text-xl md:text-2xl">
            ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
          </span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-14 items-start">

          {/* ── Left: Items ── */}
          <div>
            <div>
              {items.map((item) => (
                <CartItemFull
                  key={item.variantId}
                  item={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Continue shopping */}
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-text hover:text-black transition-colors"
              >
                ← Continuar comprando
              </Link>
            </div>

            {/* Related products */}
            {filteredSuggestions.length > 0 && (
              <section className="mt-16 md:mt-20">
                <h2 className="font-display text-xl font-bold mb-6">También te puede gustar</h2>
                <ProductGrid products={filteredSuggestions} />
              </section>
            )}
          </div>

          {/* ── Right: Sticky summary ── */}
          <div className="lg:sticky lg:top-24">
            <OrderSummaryPanel
              subtotal={subtotal}
              appliedDiscount={appliedDiscount}
              estimatedTotal={estimatedTotal}
              discountCode={discountCode}
              discountError={discountError}
              discountLoading={discountLoading}
              wholesaleActive={wholesaleActive}
              onCodeChange={(v) => { setDiscountCode(v); setDiscountError('') }}
              onApplyDiscount={applyDiscount}
              onRemoveDiscount={() => clearDiscount()}
            />
          </div>

        </div>
      </div>
    </main>
  )
}
