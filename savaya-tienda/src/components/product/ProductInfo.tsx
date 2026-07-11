'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatPrice, getDiscountPercentage, isLowStock } from '@/lib/utils'
import type { Product, ProductVariant } from '@/lib/types'
import { useCartStore } from '@/store/cartStore'
import Badge from '@/components/ui/Badge'
import ColorSelector from './ColorSelector'
import SizeSelector from './SizeSelector'
import SizeGuide, { type SizeGuideData } from './SizeGuide'
import { useCurrency } from '@/components/providers/CurrencyProvider'

// ─── Icons ────────────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-sale">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      className={cn('transition-transform duration-200', open && 'rotate-180')}
    >
      <polyline points="3 6 8 11 13 6" />
    </svg>
  )
}

// ─── Accordion ────────────────────────────────────────────────────────────────

interface AccordionItem { id: string; title: string; content: string }

function Accordion({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="border-t border-gray-light divide-y divide-gray-light">
      {items.map(({ id, title, content }) => {
        const isOpen = openId === id
        return (
          <div key={id}>
            <button
              onClick={() => setOpenId(isOpen ? null : id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between py-4 text-sm font-heading font-semibold hover:text-accent transition-colors"
            >
              {title}
              <ChevronIcon open={isOpen} />
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 text-sm text-gray-text leading-relaxed',
                isOpen ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0',
              )}
            >
              {content}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── ProductInfo ──────────────────────────────────────────────────────────────

interface ProductInfoProps {
  product: Product
  variants: ProductVariant[]
  sizeGuide: SizeGuideData | null
  onColorChange?: (color: string | null) => void
}

export default function ProductInfo({ product, variants, sizeGuide, onColorChange }: ProductInfoProps) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const currency = useCurrency()
  const bcvNote = currency === 'USD' ? 'Precio en dólares · Tasa DÓLAR BCV' : 'Precio en euros · Tasa EURO BCV'

  const { name, base_price, sale_price, is_new, description, images, id } = product
  const discountPct = sale_price != null ? getDiscountPercentage(base_price, sale_price) : null
  const savings = sale_price != null ? base_price - sale_price : null
  const divisaSavings =
    product.divisa_price != null
      ? (sale_price ?? base_price) - product.divisa_price
      : null

  // Deduplicated colors and sizes
  const allColors = [
    ...new Map(variants.map((v) => [v.color, { name: v.color, hex: v.color_hex }])).values(),
  ]
  const allSizes = [...new Set(variants.map((v) => v.size))].filter(Boolean)

  const [selectedColor, setSelectedColor] = useState<string | null>(
    allColors.length === 1 ? allColors[0].name : null,
  )
  const [selectedSize, setSelectedSize] = useState<string | null>(
    allSizes.length === 1 ? (allSizes[0] ?? null) : null,
  )
  const [wished, setWished] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(false)

  // Sizes with no stock for the current color context
  const outOfStockSizes = allSizes.filter(
    (size) => !variants.some(
      (v) => v.size === size && (selectedColor === null || v.color === selectedColor) && v.stock > 0,
    ),
  )

  // Resolved variant — matches current color+size selection
  const selectedVariant = variants.find((v) => {
    const colorOk = allColors.length <= 1 || v.color === selectedColor
    const sizeOk = allSizes.length === 0 || v.size === selectedSize
    return colorOk && sizeOk
  })

  const needsColor = allColors.length > 1
  const needsSize = allSizes.length > 1

  const canAdd =
    variants.length === 0 ||
    ((!needsColor || selectedColor !== null) &&
      (!needsSize || selectedSize !== null) &&
      selectedVariant !== undefined &&
      selectedVariant.stock > 0)

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    setSelectedSize(null)
    onColorChange?.(color)
  }

  function doAddToCart() {
    const colorImage = selectedColor
      ? product.color_images?.find((ci) => ci.color === selectedColor)?.images?.[0]
      : undefined
    addItem({
      variantId: selectedVariant?.id ?? `${id}-default`,
      productId: id,
      name,
      image: colorImage ?? images[0] ?? '',
      price: sale_price ?? base_price,
      wholesalePrice: product.wholesale_price ?? undefined,
      divisaPrice: product.divisa_price ?? undefined,
      wholesaleDivisaPrice: product.wholesale_divisa_price ?? undefined,
      size: selectedSize ?? selectedVariant?.size ?? '',
      color: selectedColor ?? selectedVariant?.color ?? '',
      stock: selectedVariant?.stock,
      quantity: 1,
    })
  }

  function handleAddToCart() {
    if (!canAdd) return
    doAddToCart()
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1500)
  }

  function handleBuyNow() {
    if (!canAdd) return
    doAddToCart()
    router.push('/checkout')
  }

  const displaySku = selectedVariant?.sku
    ?? (selectedColor ? variants.find((v) => v.color === selectedColor)?.sku : variants[0]?.sku)

  const accordionItems: AccordionItem[] = [
    {
      id: 'descripcion',
      title: 'Descripción',
      content: description ?? 'Descripción no disponible para este producto.',
    },
    {
      id: 'materiales',
      title: 'Materiales y cuidados',
      content:
        'Lavar a mano con agua fría. No usar blanqueador. Planchar a temperatura baja. No secar en secadora. Guardar en lugar fresco y seco.',
    },
    {
      id: 'envio',
      title: 'Política de envío',
      content:
        'Envíos a todo Venezuela. Entrega estimada en 3–5 días hábiles según tu ciudad. Devoluciones aceptadas dentro de los 7 días calendario tras recibir el pedido.',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* ── Name + wishlist ── */}
      <div>
        {is_new && <Badge variant="new" className="mb-3" />}
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">{name}</h1>
          <button
            onClick={() => setWished((v) => !v)}
            aria-label={wished ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className="shrink-0 mt-1 hover:scale-110 active:scale-95 transition-transform"
          >
            <HeartIcon filled={wished} />
          </button>
        </div>
        {displaySku && (
          <p className="text-xs text-gray-text mt-1.5">Ref: {displaySku}</p>
        )}
      </div>

      {/* ── Price ── */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={cn('font-heading text-2xl font-bold', sale_price != null && 'text-sale')}>
          {formatPrice(sale_price ?? base_price, currency)}
        </span>
        {sale_price != null && (
          <>
            <span className="text-gray-text text-base line-through">{formatPrice(base_price, currency)}</span>
            <Badge variant="sale" label={`-${discountPct}%`} />
          </>
        )}
        {savings != null && (
          <span className="w-full text-xs text-gray-text">
            Ahorras {formatPrice(savings, currency)}
          </span>
        )}
        <span className="w-full text-[10px] font-heading font-semibold uppercase tracking-wider text-gray-text">
          {bcvNote}
        </span>
      </div>

      {/* ── Divisa price panel ── */}
      {product.divisa_price != null && (
        <div className="rounded-lg overflow-hidden border-2 border-green-500">
          <div className="bg-green-600 px-4 py-3 text-white">
            <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-green-100 mb-1.5">
              💵 Paga en Zelle · USDT · Binance
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-heading font-bold text-2xl">
                {formatPrice(product.divisa_price, 'USD')}
              </span>
              {divisaSavings != null && divisaSavings > 0 && (
                <span className="shrink-0 bg-white text-green-700 text-[11px] font-heading font-black px-3 py-1 rounded-full uppercase tracking-wide">
                  ¡Ahorra {formatPrice(divisaSavings, 'USD')}!
                </span>
              )}
            </div>
          </div>
          {divisaSavings != null && divisaSavings > 0 && (
            <div className="bg-green-50 px-4 py-2">
              <p className="text-[11px] text-green-600 text-right">
                vs {formatPrice(sale_price ?? base_price, currency)} con transferencia o pago móvil
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Color ── */}
      {allColors.length > 1 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-heading font-semibold">
            Color:{' '}
            <span className="font-normal text-gray-text">{selectedColor ?? 'Selecciona uno'}</span>
          </p>
          <ColorSelector colors={allColors} selected={selectedColor} onSelect={handleColorSelect} />
        </div>
      )}

      {/* ── Size ── */}
      {allSizes.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-heading font-semibold">
              Talla:{' '}
              <span className="font-normal text-gray-text">{selectedSize ?? 'Selecciona una'}</span>
            </p>
            <SizeGuide guide={sizeGuide} />
          </div>
          <SizeSelector
            sizes={allSizes}
            selected={selectedSize}
            onSelect={setSelectedSize}
            outOfStock={outOfStockSizes}
          />
          {selectedVariant != null && isLowStock(selectedVariant.stock) && (
            <p className="text-xs font-semibold text-sale animate-pulse">
              ¡Solo quedan {selectedVariant.stock} unidades!
            </p>
          )}
        </div>
      )}

      {/* ── Add-to-cart buttons ── */}
      <div className="flex flex-col gap-3 pt-1">
        <button
          onClick={handleAddToCart}
          disabled={!canAdd}
          className={cn(
            'w-full flex items-center justify-center gap-2.5 py-4 text-sm font-heading font-bold tracking-widest',
            'rounded transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
            addedFeedback
              ? 'bg-green-600 text-white'
              : 'bg-black text-white hover:bg-accent',
          )}
        >
          {addedFeedback ? (
            '✓ AGREGADO AL CARRITO'
          ) : (
            <>
              <BagIcon />
              AGREGAR AL CARRITO
            </>
          )}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!canAdd}
          className={cn(
            'w-full py-4 text-sm font-heading font-bold tracking-widest rounded border-2 border-black',
            'transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
            'hover:bg-black hover:text-white',
          )}
        >
          COMPRAR AHORA
        </button>
      </div>

      {/* ── Trust badges ── */}
      <div className="border border-gray-light rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-gray-light">
          <div className="flex flex-col items-center gap-2 px-3 py-3 text-center">
            <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </span>
            <span className="text-[10px] font-heading font-bold text-gray-700 leading-tight">Compra<br/>Segura</span>
          </div>
          <div className="flex flex-col items-center gap-2 px-3 py-3 text-center">
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <circle cx="12" cy="16" r="1" fill="#2563eb"/>
              </svg>
            </span>
            <span className="text-[10px] font-heading font-bold text-gray-700 leading-tight">Pagos<br/>Seguros</span>
          </div>
          <div className="flex flex-col items-center gap-2 px-3 py-3 text-center">
            <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/>
              </svg>
            </span>
            <span className="text-[10px] font-heading font-bold text-gray-700 leading-tight">Privacidad<br/>Protegida</span>
          </div>
        </div>
        <div className="border-t border-gray-light px-4 py-2.5 flex items-center gap-2 bg-gray-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p className="text-[11px] text-gray-500">
            Vendido y enviado por{' '}
            <span className="font-heading font-bold text-black">Savaya</span>
          </p>
        </div>
      </div>

      {/* ── Payment methods ── */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-gray-text">
          Formas de pago disponibles
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {/* Binance Pay */}
          <span className="flex flex-col items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-1.5 py-2">
            <span className="w-6 h-6 rounded-full bg-[#F3BA2F] flex items-center justify-center shrink-0">
              <svg width="13" height="13" viewBox="0 0 32 32" fill="white">
                <path d="M16 4l-3 3 3 3 3-3-3-3zM8 12l-3 3 3 3 3-3-3-3zM16 12l-3 3 3 3 3-3-3-3zM24 12l-3 3 3 3 3-3-3-3zM16 20l-3 3 3 3 3-3-3-3z"/>
              </svg>
            </span>
            <span className="text-[9px] font-heading font-bold text-amber-800 leading-tight text-center">Binance Pay</span>
          </span>

          {/* USDT */}
          <span className="flex flex-col items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-1.5 py-2">
            <span className="w-6 h-6 rounded-full bg-[#26A17B] flex items-center justify-center shrink-0 text-white font-black text-[12px] leading-none">
              ₮
            </span>
            <span className="text-[9px] font-heading font-bold text-emerald-800 leading-tight text-center">USDT</span>
          </span>

          {/* Pago Móvil */}
          <span className="flex flex-col items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-1.5 py-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2"/>
                <path d="M12 18h.01"/>
                <path d="M9.5 8c.5-.8 1.4-1.5 2.5-1.5s2 .7 2.5 1.5"/>
                <path d="M8 6C9 4.5 10.4 3.5 12 3.5s3 1 4 2.5"/>
              </svg>
            </span>
            <span className="text-[9px] font-heading font-bold text-blue-800 leading-tight text-center">Pago Móvil</span>
          </span>

          {/* Transferencia */}
          <span className="flex flex-col items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-2">
            <span className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 22h18M3 10h18M12 2L3 10h18L12 2z"/>
                <line x1="7" y1="10" x2="7" y2="22"/>
                <line x1="12" y1="10" x2="12" y2="22"/>
                <line x1="17" y1="10" x2="17" y2="22"/>
              </svg>
            </span>
            <span className="text-[9px] font-heading font-bold text-slate-700 leading-tight text-center">Transferencia</span>
          </span>

          {/* Efectivo */}
          <span className="flex flex-col items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-1.5 py-2">
            <span className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="12" rx="2"/>
                <circle cx="12" cy="13" r="2.5"/>
                <path d="M6 13h.01M18 13h.01"/>
              </svg>
            </span>
            <span className="text-[9px] font-heading font-bold text-green-800 leading-tight text-center">Efectivo</span>
          </span>
        </div>
      </div>

      {/* ── Shipping info ── */}
      <div className="flex items-center gap-3 border-t border-gray-light pt-4">
        <div className="shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white">
          <TruckIcon />
        </div>
        <div>
          <p className="font-heading font-black text-sm text-green-700 uppercase tracking-wide">Envío GRATIS</p>
          <p className="text-[11px] text-gray-text">Por agencia · Zoom, Tealca o MRW a todo el país</p>
        </div>
      </div>

      {/* ── Accordion ── */}
      <Accordion items={accordionItems} />
    </div>
  )
}
