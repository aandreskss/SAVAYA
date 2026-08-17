'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Button,
  Price,
  QuantityStepper,
  Accordion,
  Modal,
} from '@/shared/ui'
import { ProductVariantSelector } from './ProductVariantSelector'
import { convertToVes, formatVes } from '@/domains/exchange-rates/service'
import type { ProductDetail } from '@/domains/catalog/repository'
import type { ExchangeRate } from '@/domains/exchange-rates/service'
import type { ActionResult } from '@/shared/lib/types'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProductInfoProps = {
  product: ProductDetail
  selectedVariantId: string | undefined
  exchangeRate: ExchangeRate
  onVariantChange: (variantId: string) => void
  onAddToCart: (variantId: string, quantity: number) => Promise<ActionResult<unknown>>
  onWishlistToggle: (productId: string) => Promise<void>
  isInWishlist: boolean
}

// ---------------------------------------------------------------------------
// Size guide content (static placeholder)
// ---------------------------------------------------------------------------

function SizeGuideContent() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-sans border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 font-medium text-text-primary">Talla VE</th>
            <th className="text-left py-2 pr-4 font-medium text-text-primary">Talla EU</th>
            <th className="text-left py-2 pr-4 font-medium text-text-primary">Largo (cm)</th>
          </tr>
        </thead>
        <tbody className="text-text-secondary">
          {[
            { ve: '35', eu: '35', cm: '22.5' },
            { ve: '36', eu: '36', cm: '23.0' },
            { ve: '37', eu: '37', cm: '23.5' },
            { ve: '38', eu: '38', cm: '24.0' },
            { ve: '39', eu: '39', cm: '24.5' },
            { ve: '40', eu: '40', cm: '25.0' },
            { ve: '41', eu: '41', cm: '25.5' },
          ].map((row) => (
            <tr key={row.ve} className="border-b border-border/50 last:border-0">
              <td className="py-2 pr-4">{row.ve}</td>
              <td className="py-2 pr-4">{row.eu}</td>
              <td className="py-2 pr-4">{row.cm}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-xs text-text-secondary">
        Para una medición exacta, párate sobre una hoja de papel y marca el punto más largo del pie.
        Mide de talón a punta.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Accordion items
// ---------------------------------------------------------------------------

function buildAccordionItems(description: string | null) {
  return [
    {
      id: 'descripcion',
      trigger: 'Descripción',
      content: (
        <p className="leading-relaxed">
          {description ??
            'Este producto fue diseñado con materiales de alta calidad seleccionados especialmente para la comodidad y durabilidad.'}
        </p>
      ),
    },
    {
      id: 'materiales',
      trigger: 'Materiales y cuidado',
      content: (
        <ul className="space-y-1 leading-relaxed">
          <li>• Cuero genuino venezolano en la parte exterior</li>
          <li>• Plantilla en cuero suave con acolchado</li>
          <li>• Suela de goma antideslizante</li>
          <li>• Limpiar con paño húmedo. Evitar exposición prolongada al sol.</li>
        </ul>
      ),
    },
    {
      id: 'envios',
      trigger: 'Envíos',
      content: (
        <ul className="space-y-1 leading-relaxed">
          <li>• Delivery en Valencia: 24-48 horas</li>
          <li>• Envío nacional por MRW o Zoom: 3-7 días hábiles</li>
          <li>• Retiro en tienda disponible en CC Multi Tienda God is Good, local A-4</li>
          <li>• El costo de envío se calcula al momento del checkout</li>
        </ul>
      ),
    },
    {
      id: 'cambios',
      trigger: 'Cambios y devoluciones',
      content: (
        <ul className="space-y-1 leading-relaxed">
          <li>• Cambio de talla dentro de los 15 días desde la compra</li>
          <li>• El producto debe estar sin uso y en su empaque original</li>
          <li>• Para iniciar un cambio, escríbenos por WhatsApp con tu número de pedido</li>
        </ul>
      ),
    },
    {
      id: 'pagos',
      trigger: 'Medios de pago aceptados',
      content: (
        <ul className="space-y-1 leading-relaxed">
          <li>• Zelle (USD)</li>
          <li>• Pago Móvil (Bs.)</li>
          <li>• Transferencia bancaria (Bs.)</li>
          <li>• USDT TRC20 (USD)</li>
          <li>• Binance Pay (USD)</li>
          <li>• Efectivo en tienda (USD o Bs.)</li>
        </ul>
      ),
    },
  ]
}

// ---------------------------------------------------------------------------
// HeartIcon
// ---------------------------------------------------------------------------

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
    >
      <path
        d="M10 17s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 17 8c0 4.5-7 9-7 9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// ProductInfo
// ---------------------------------------------------------------------------

export function ProductInfo({
  product,
  selectedVariantId,
  exchangeRate,
  onVariantChange,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
}: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId)
  const displayPrice = selectedVariant?.price ?? product.basePrice
  const displayCompareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice
  const maxQuantity = selectedVariant?.stock ?? 0
  const canAddToCart = !!selectedVariant && selectedVariant.isAvailable && !isPending

  const priceVes = convertToVes(displayPrice, exchangeRate)

  // Discount badge
  const discountBadge =
    displayCompareAt && displayCompareAt > displayPrice
      ? `-${Math.round(((displayCompareAt - displayPrice) / displayCompareAt) * 100)}%`
      : undefined

  function handleAddToCart() {
    // Enforce: impossible to call without a selected variant
    if (!selectedVariant) return

    setCartError(null)
    setCartSuccess(false)

    startTransition(async () => {
      const result = await onAddToCart(selectedVariant.id, quantity)
      if (result.success) {
        setCartSuccess(true)
        setTimeout(() => setCartSuccess(false), 2500)
      } else {
        setCartError(result.error)
      }
    })
  }

  function handleWishlistToggle() {
    startTransition(async () => {
      await onWishlistToggle(product.id)
    })
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header — name + category */}
        <div className="flex flex-col gap-1">
          {product.category && (
            <Link
              href={`/categoria/${product.category.slug}`}
              className="font-sans text-xs font-medium uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="font-display font-black text-[28px] md:text-[32px] uppercase tracking-tight text-text-primary leading-tight">
            {product.name}
          </h1>

          {selectedVariant && (
            <p className="font-sans text-sm text-text-secondary mt-1">
              SKU: {selectedVariant.sku}
            </p>
          )}
        </div>

        {/* Price block */}
        <div className="flex flex-col gap-1">
          <Price
            amount={displayPrice}
            currency="USD"
            compareAtAmount={displayCompareAt ?? undefined}
            discountBadge={discountBadge}
            size="lg"
          />
          <p className="font-sans text-sm text-text-secondary">
            ≈ {formatVes(priceVes)}
          </p>
        </div>

        {/* Variant selector */}
        <ProductVariantSelector
          variants={product.variants}
          selectedVariantId={selectedVariantId}
          onVariantChange={(variantId) => {
            setCartError(null)
            setCartSuccess(false)
            setQuantity(1)
            onVariantChange(variantId)
          }}
        />

        {/* Size guide link */}
        <button
          type="button"
          onClick={() => setIsSizeGuideOpen(true)}
          className={cn(
            'self-start font-sans text-xs text-text-secondary underline underline-offset-2',
            'hover:text-text-primary transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded',
          )}
        >
          Guía de tallas →
        </button>

        {/* Quantity + CTA */}
        <div className="flex flex-col gap-4">
          {/* Quantity stepper — only visible when variant is selected */}
          {selectedVariant && (
            <div className="flex flex-col gap-1">
              <span className="font-sans text-sm font-medium text-text-primary">Cantidad</span>
              <QuantityStepper
                value={quantity}
                min={1}
                max={maxQuantity > 0 ? maxQuantity : 1}
                onChange={setQuantity}
                disabled={!canAddToCart}
              />
              {selectedVariant.stock <= 3 && selectedVariant.stock > 0 && (
                <p className="font-sans text-xs text-warning">
                  ¡Últimas {selectedVariant.stock} unidades disponibles!
                </p>
              )}
            </div>
          )}

          {/* Status messages */}
          {cartError && (
            <p role="alert" className="font-sans text-sm text-error">
              {cartError}
            </p>
          )}
          {cartSuccess && (
            <p role="status" className="font-sans text-sm text-success">
              Producto agregado al carrito.
            </p>
          )}
          {!selectedVariantId && (
            <p className="font-sans text-sm text-text-secondary">
              Selecciona un color y talla para continuar.
            </p>
          )}
          {selectedVariant && !selectedVariant.isAvailable && (
            <p role="alert" className="font-sans text-sm text-error">
              Esta variante está agotada.
            </p>
          )}

          {/* CTA row */}
          <div
            className={cn(
              'flex gap-3',
              // Sticky on mobile
              'md:relative fixed md:bottom-auto bottom-0 md:left-auto left-0 md:right-auto right-0',
              'md:bg-transparent bg-surface md:shadow-none shadow-[0_-2px_12px_rgba(0,0,0,0.08)]',
              'md:p-0 p-4 z-30',
            )}
          >
            <Button
              variant="primary"
              size="lg"
              disabled={!canAddToCart}
              onClick={handleAddToCart}
              className="flex-1"
              aria-busy={isPending}
            >
              {isPending ? 'Agregando…' : 'Agregar al carrito'}
            </Button>

            <button
              type="button"
              aria-label={isInWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              onClick={handleWishlistToggle}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-sm border border-border shrink-0',
                'transition-colors duration-150',
                'hover:border-border-hover hover:text-text-primary',
                'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                isInWishlist ? 'text-error border-error/30 bg-error/5' : 'text-text-secondary',
              )}
            >
              <HeartIcon filled={isInWishlist} />
            </button>
          </div>
        </div>

        {/* Trust pills — payment methods */}
        <div className="flex flex-wrap gap-2" aria-label="Métodos de pago aceptados">
          {['Pago Móvil', 'Zelle', 'USDT', 'Cambios gratis'].map((label) => (
            <span
              key={label}
              className="inline-flex items-center px-3 py-1 rounded-pill border border-border bg-surface-2 font-sans text-xs text-text-secondary"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Accordion — product details */}
        <Accordion
          items={buildAccordionItems(product.description)}
          allowMultiple={false}
          className="border-t border-border"
        />
      </div>

      {/* Size guide modal */}
      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Guía de tallas"
        size="md"
      >
        <SizeGuideContent />
      </Modal>
    </>
  )
}
