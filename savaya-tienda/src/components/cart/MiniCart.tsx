'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { useWholesaleMinQty } from '@/components/providers/WholesaleProvider'
import { useCurrency } from '@/components/providers/CurrencyProvider'
import { computeWholesaleSubtotal, isWholesaleActive } from '@/lib/wholesale'
import CartItem from './CartItem'

// ─── Icons ────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" />
    </svg>
  )
}

function EmptyBagIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-text/30">
      <path d="M18 14L9 26v40a5 5 0 0 0 5 5h44a5 5 0 0 0 5-5V26l-9-12z" />
      <line x1="9" y1="26" x2="63" y2="26" />
      <path d="M48 36a12 12 0 0 1-24 0" />
    </svg>
  )
}

// ─── MiniCart ─────────────────────────────────────────────────────────────────

export default function MiniCart() {
  const items = useCartStore((s) => s.items)
  const isOpen = useCartStore((s) => s.isOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const openCart = useCartStore((s) => s.openCart)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Open cart whenever an item is added (handles catalog pages where isOpen isn't persisted)
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  const prevTotalQty = useRef(totalQty)
  useEffect(() => {
    if (totalQty > prevTotalQty.current) openCart()
    prevTotalQty.current = totalQty
  }, [totalQty, openCart])

  const wholesaleMinQty = useWholesaleMinQty()
  const currency = useCurrency()
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = computeWholesaleSubtotal(items, wholesaleMinQty)
  const wholesaleActive = isWholesaleActive(items, wholesaleMinQty)

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={closeCart}
        className={[
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={[
          'fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl',
          'w-full md:w-[400px]',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-light shrink-0">
          <p className="font-heading font-semibold text-base">
            Mi carrito
            {totalItems > 0 && (
              <span className="ml-1.5 text-gray-text font-normal">({totalItems})</span>
            )}
          </p>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="p-1 text-gray-text hover:text-black transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <EmptyBagIcon />
            <div>
              <p className="font-heading font-semibold text-base mb-1">Tu carrito está vacío</p>
              <p className="text-sm text-gray-text">Agrega productos para continuar comprando</p>
            </div>
            <Link
              href="/nuevas-colecciones"
              onClick={closeCart}
              className="mt-1 px-6 py-3 bg-black text-white text-sm font-heading font-semibold rounded hover:bg-accent transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-6">
              {items.map((item) => (
                <CartItem
                  key={item.variantId}
                  item={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 pt-4 pb-6 border-t border-gray-light shrink-0 flex flex-col gap-4">
              {/* Wholesale badge */}
              {wholesaleActive && (
                <div className="bg-gold/10 border border-gold/30 rounded px-3 py-2 text-xs font-heading font-semibold text-[#8B6914]">
                  Descuento por compra al por mayor aplicado
                </div>
              )}
              {!wholesaleActive && items.some((i) => i.wholesalePrice != null) && (
                <p className="text-xs text-gray-text text-center">
                  Agrega hasta{' '}
                  <span className="font-semibold text-black">{wholesaleMinQty - totalItems}</span>{' '}
                  par(es) más para precio al mayor
                </p>
              )}

              {/* Totals */}
              <div className="flex justify-between items-baseline font-heading font-bold text-base border-t border-gray-light pt-3">
                <span>Total</span>
                <div className="text-right">
                  <span>{formatPrice(subtotal, currency)}</span>
                  <p className="text-xs font-normal text-gray-text">+ envío</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full py-3.5 bg-black text-white text-sm font-heading font-bold tracking-widest text-center rounded hover:bg-accent transition-colors"
                >
                  IR AL CHECKOUT
                </Link>
                <Link
                  href="/carrito"
                  onClick={closeCart}
                  className="block w-full py-3.5 border-2 border-black text-sm font-heading font-bold tracking-widest text-center rounded hover:bg-black hover:text-white transition-colors"
                >
                  VER CARRITO
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
