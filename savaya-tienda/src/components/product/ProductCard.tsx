'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, getDiscountPercentage, cn } from '@/lib/utils'
import { cloudinaryContainLoader } from '@/lib/cloudinary'
import type { Product, ProductVariant } from '@/lib/types'
import { useCartStore } from '@/store/cartStore'
import { useWishlist } from '@/hooks/useWishlist'
import { useCurrency } from '@/components/providers/CurrencyProvider'

const GENDER_LABEL: Record<string, string> = {
  women: 'Mujer',
  men: 'Hombre',
  kids: 'Niños',
  unisex: 'Unisex',
}

function HeartIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-sale">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { name, slug, base_price, sale_price, images, is_new, is_featured, variants = [], gender } = product
  const addItem = useCartStore((s) => s.addItem)
  const { isWishlisted, toggle: toggleWishlist } = useWishlist()
  const currency = useCurrency()

  const wished = isWishlisted(product.id)
  const [showSizePicker, setShowSizePicker] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)

  // Quick view state (independent from card state)
  const [qvColor, setQvColor] = useState<string | null>(null)
  const [qvSize, setQvSize] = useState<string | null>(null)

  const discountPct = sale_price ? getDiscountPercentage(base_price, sale_price) : null
  const badge = is_new ? 'new' : discountPct ? 'sale' : is_featured ? 'bestseller' : null
  const divisaSaving =
    product.divisa_price != null
      ? (sale_price ?? base_price) - product.divisa_price
      : null

  // Total stock across all variants for low-stock indicator
  const totalStock = variants.reduce((s, v) => s + (v.stock ?? 0), 0)
  const isLowStock = totalStock > 0 && totalStock <= 5

  const colorImagesMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const ci of product.color_images ?? []) {
      if (ci.images?.length > 0) map[ci.color] = ci.images[0]
    }
    return map
  }, [product.color_images])

  const displayImg = (selectedColor && colorImagesMap[selectedColor]) || images[0] || null
  const qvDisplayImg = (qvColor && colorImagesMap[qvColor]) || images[0] || null

  const colorMap = new Map<string, string>()
  variants.forEach((v) => { if (v.color && !colorMap.has(v.color)) colorMap.set(v.color, v.color_hex) })
  const allColors = [...colorMap.entries()]
  const displayColors = allColors.slice(0, 5)
  const extraColors = allColors.length - displayColors.length

  const uniqueSizes = [...new Set(variants.map((v) => v.size))].filter(Boolean)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (uniqueSizes.length <= 1) {
      const variant: ProductVariant | undefined = variants[0]
      addItem({
        variantId: variant?.id ?? `${product.id}-default`,
        productId: product.id,
        name,
        image: images[0] ?? '',
        price: sale_price ?? base_price,
        wholesalePrice: product.wholesale_price ?? undefined,
        divisaPrice: product.divisa_price ?? undefined,
        wholesaleDivisaPrice: product.wholesale_divisa_price ?? undefined,
        size: variant?.size ?? '',
        color: variant?.color ?? '',
        stock: variant?.stock,
        quantity: 1,
      })
      showFeedback()
    } else {
      setShowSizePicker(true)
    }
  }

  function handleAddWithSize(size: string, color?: string | null) {
    const variant = color
      ? (variants.find((v) => v.size === size && v.color === color) ?? variants.find((v) => v.size === size))
      : variants.find((v) => v.size === size)
    addItem({
      variantId: variant?.id ?? `${product.id}-${size}`,
      productId: product.id,
      name,
      image: images[0] ?? '',
      price: sale_price ?? base_price,
      wholesalePrice: product.wholesale_price ?? undefined,
      divisaPrice: product.divisa_price ?? undefined,
      wholesaleDivisaPrice: product.wholesale_divisa_price ?? undefined,
      size,
      color: variant?.color ?? color ?? '',
      stock: variant?.stock,
      quantity: 1,
    })
    setShowSizePicker(false)
    showFeedback()
  }

  function showFeedback() {
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 1500)
  }

  function openQuickView(e: React.MouseEvent) {
    e.preventDefault()
    setQvColor(allColors[0]?.[0] ?? null)
    setQvSize(null)
    setShowQuickView(true)
  }

  function renderSwatch(colorName: string, hex: string, isSelected: boolean, onClick: () => void, size: 'sm' | 'md' = 'sm') {
    const [h1, h2] = (hex || '#ccc').split('|')
    const isWhiteSolid = !h2 && h1.toUpperCase() === '#FFFFFF'
    const bgStyle: React.CSSProperties = h2
      ? { background: `linear-gradient(135deg, ${h1} 50%, ${h2} 50%)` }
      : { backgroundColor: h1 || '#ccc' }
    const sizeClass = size === 'md' ? 'w-6 h-6' : 'w-4 h-4'
    return (
      <button
        key={colorName}
        type="button"
        title={colorName}
        onClick={onClick}
        className={cn(sizeClass, 'rounded-full shrink-0 transition-all overflow-hidden', isSelected ? 'scale-110' : 'hover:scale-105')}
        style={{
          ...bgStyle,
          boxShadow: isSelected
            ? '0 0 0 2px #000'
            : h2
              ? '0 0 0 1px #c8c8c8'
              : isWhiteSolid
                ? '0 0 0 1px #d5d5d5'
                : undefined,
        }}
      />
    )
  }

  return (
    <>
      <article className="flex flex-col">
        {/* ── Image container ── */}
        <div className="relative overflow-hidden rounded bg-white group cursor-pointer">
          <Link href={`/${slug}`} className="block aspect-[3/4]">
            {displayImg && (
              <Image
                loader={cloudinaryContainLoader}
                src={displayImg}
                alt={name}
                fill
                priority={priority}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain transition-opacity duration-300"
              />
            )}
          </Link>

          {/* Badge */}
          {badge && (
            <div className="absolute top-2.5 left-2.5 pointer-events-none">
              {badge === 'new' && (
                <span className="font-heading font-bold text-xs text-black bg-white px-2 py-0.5 rounded-sm shadow-sm tracking-wide">
                  Nuevo
                </span>
              )}
              {badge === 'sale' && discountPct && (
                <span className="font-heading font-bold text-xs text-white bg-sale px-2 py-0.5 rounded-sm shadow-sm tracking-wide">
                  -{discountPct}%
                </span>
              )}
              {badge === 'bestseller' && (
                <span className="font-heading font-bold text-xs text-black bg-gold px-2 py-0.5 rounded-sm shadow-sm tracking-wide flex items-center gap-1">
                  ★ Más vendido
                </span>
              )}
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist(product.id) }}
            aria-label={wished ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
          >
            <HeartIcon filled={wished} />
          </button>

          {/* Divisa badge */}
          {product.divisa_price != null && (
            <div className="absolute bottom-2 left-2 pointer-events-none md:group-hover:opacity-0 transition-opacity duration-200">
              <span className="flex items-center gap-1 bg-green-600 text-white text-[10px] font-heading font-black px-2 py-0.5 rounded-sm shadow-sm tracking-wide">
                {divisaSaving != null && divisaSaving > 0
                  ? `💵 Ahorra ${formatPrice(divisaSaving, 'USD')}`
                  : '💵 Divisa'}
              </span>
            </div>
          )}

          {/* Desktop: Quick View + Add to cart — slides up on hover */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 hidden md:flex flex-col">
            <button
              onClick={openQuickView}
              className="w-full py-2 text-xs font-heading font-bold tracking-widest bg-white/95 text-black hover:bg-white transition-colors flex items-center justify-center gap-1.5 border-b border-gray-light"
            >
              <EyeIcon /> Ver rápido
            </button>
            <button
              onClick={handleAdd}
              className={cn(
                'w-full py-2.5 text-xs font-heading font-bold tracking-widest transition-colors',
                addedFeedback
                  ? 'bg-green-600 text-white'
                  : 'bg-accent text-white hover:bg-black'
              )}
            >
              {addedFeedback ? '✓ AGREGADO' : 'AGREGAR'}
            </button>
          </div>
        </div>

        {/* ── Info ── */}
        <div className="mt-2.5 flex flex-col gap-1">
          {displayColors.length > 0 && (
            <div className="flex items-center gap-1.5">
              {displayColors.map(([colorName, hex]) =>
                renderSwatch(
                  colorName,
                  hex,
                  selectedColor === colorName,
                  () => setSelectedColor(selectedColor === colorName ? null : colorName)
                )
              )}
              {extraColors > 0 && (
                <span className="text-[10px] text-gray-text">+{extraColors}</span>
              )}
            </div>
          )}

          <Link
            href={`/${slug}`}
            className="font-heading font-semibold text-sm text-black leading-snug line-clamp-2 hover:underline underline-offset-2 mt-0.5"
          >
            {name}
          </Link>

          {gender && GENDER_LABEL[gender] && (
            <p className="text-xs text-gray-text">{GENDER_LABEL[gender]}</p>
          )}

          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={cn('font-heading font-bold text-sm', sale_price != null && 'text-sale')}>
              {formatPrice(sale_price ?? base_price, currency)}
            </span>
            {sale_price && (
              <span className="text-xs text-gray-text line-through">
                {formatPrice(base_price, currency)}
              </span>
            )}
          </div>

          {/* Low stock indicator */}
          {isLowStock && (
            <p className="text-[10px] font-heading font-semibold text-sale flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sale" />
              ¡Solo quedan {totalStock} {totalStock === 1 ? 'unidad' : 'unidades'}!
            </p>
          )}

          {product.divisa_price != null && (
            <div className="mt-1.5 rounded overflow-hidden border border-green-500">
              {divisaSaving != null && divisaSaving > 0 && (
                <div className="bg-green-600 px-2.5 py-1 text-center">
                  <p className="text-white text-[10px] font-heading font-black tracking-wide">
                    💵 ¡Ahorra {formatPrice(divisaSaving, 'USD')} en divisa!
                  </p>
                </div>
              )}
              <div className="bg-green-50 px-2.5 py-1 flex items-center justify-between gap-1">
                <span className="text-[10px] font-heading font-semibold text-green-700">Zelle · USDT</span>
                <span className="text-[11px] font-heading font-bold text-green-800">{formatPrice(product.divisa_price, 'USD')}</span>
              </div>
            </div>
          )}

          {/* Mobile add-to-cart */}
          <button
            onClick={handleAdd}
            className={cn(
              'md:hidden mt-1.5 w-full border py-2 text-xs font-heading font-bold tracking-widest rounded transition-colors',
              addedFeedback
                ? 'bg-green-600 border-green-600 text-white'
                : 'border-accent text-accent hover:bg-accent hover:text-white'
            )}
          >
            {addedFeedback ? '✓ AGREGADO' : 'AGREGAR'}
          </button>
        </div>
      </article>

      {/* ── Size picker modal (card) ── */}
      {showSizePicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowSizePicker(false)}
        >
          <div className="absolute inset-0 bg-black/50" aria-hidden />
          <div
            className="relative bg-white rounded-t-xl sm:rounded-lg w-full sm:max-w-xs p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-sm">Selecciona tu talla</h3>
              <button onClick={() => setShowSizePicker(false)} className="text-gray-text hover:text-black text-xl leading-none">×</button>
            </div>
            <p className="text-xs text-gray-text mb-4 line-clamp-1">{name}</p>
            <div className="flex flex-wrap gap-2">
              {uniqueSizes.map((size) => {
                const variant = variants.find((v) => v.size === size)
                const inStock = !variant || variant.stock > 0
                return (
                  <button
                    key={size}
                    onClick={() => inStock && handleAddWithSize(size)}
                    disabled={!inStock}
                    className={cn(
                      'h-10 min-w-10 px-3 rounded border text-sm font-heading font-semibold transition-colors',
                      inStock
                        ? 'border-gray-light hover:border-black hover:bg-accent hover:text-white'
                        : 'border-gray-light text-gray-text opacity-40 cursor-not-allowed line-through'
                    )}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-text mt-4">
              <Link href={`/${slug}`} className="underline underline-offset-2">Ver detalle del producto →</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Quick View modal ── */}
      {showQuickView && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowQuickView(false)}
        >
          <div className="absolute inset-0 bg-black/60" aria-hidden />
          <div
            className="relative bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:flex">
              {/* Image panel */}
              <div className="relative aspect-[4/3] sm:aspect-[3/4] sm:w-[45%] bg-white shrink-0">
                {qvDisplayImg && (
                  <Image
                    loader={cloudinaryContainLoader}
                    src={qvDisplayImg}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 100vw, 45vw"
                    className="object-contain"
                  />
                )}
                {badge === 'bestseller' && (
                  <div className="absolute top-3 left-3">
                    <span className="font-heading font-bold text-xs text-black bg-gold px-2 py-0.5 rounded-sm shadow-sm tracking-wide flex items-center gap-1">
                      ★ Más vendido
                    </span>
                  </div>
                )}
              </div>

              {/* Info panel */}
              <div className="flex-1 p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh] sm:max-h-[520px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold leading-snug">{name}</h3>
                    {gender && GENDER_LABEL[gender] && (
                      <p className="text-xs text-gray-text mt-0.5">{GENDER_LABEL[gender]}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowQuickView(false)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-bg text-gray-text hover:text-black transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className={cn('font-heading font-bold text-xl', sale_price != null && 'text-sale')}>
                    {formatPrice(sale_price ?? base_price, currency)}
                  </span>
                  {sale_price != null && (
                    <span className="text-sm text-gray-text line-through">{formatPrice(base_price, currency)}</span>
                  )}
                  {discountPct != null && (
                    <span className="text-xs font-heading font-bold text-white bg-sale px-1.5 py-0.5 rounded-sm">-{discountPct}%</span>
                  )}
                </div>

                {/* Divisa price */}
                {product.divisa_price != null && (
                  <div className="rounded overflow-hidden border border-green-500">
                    <div className="bg-green-600 px-3 py-1.5">
                      <p className="text-white text-xs font-heading font-black tracking-wide">
                        💵 {formatPrice(product.divisa_price, 'USD')} con Zelle · USDT · Binance
                      </p>
                    </div>
                  </div>
                )}

                {/* Color selector */}
                {allColors.length > 0 && (
                  <div>
                    <p className="text-xs font-heading font-semibold mb-2">
                      Color: <span className="font-normal text-gray-text">{qvColor ?? 'Selecciona uno'}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allColors.map(([colorName, hex]) =>
                        renderSwatch(
                          colorName,
                          hex,
                          qvColor === colorName,
                          () => setQvColor(colorName),
                          'md'
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Size selector */}
                {uniqueSizes.length > 0 && (
                  <div>
                    <p className="text-xs font-heading font-semibold mb-2">Talla</p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueSizes.map((size) => {
                        const variant = qvColor
                          ? (variants.find((v) => v.size === size && v.color === qvColor) ?? variants.find((v) => v.size === size))
                          : variants.find((v) => v.size === size)
                        const inStock = !variant || variant.stock > 0
                        return (
                          <button
                            key={size}
                            onClick={() => inStock && setQvSize(qvSize === size ? null : size)}
                            disabled={!inStock}
                            className={cn(
                              'h-9 min-w-9 px-2.5 rounded border text-sm font-heading font-semibold transition-colors',
                              qvSize === size
                                ? 'border-black bg-black text-white'
                                : inStock
                                  ? 'border-gray-light hover:border-black hover:bg-black/5'
                                  : 'border-gray-light text-gray-text opacity-40 cursor-not-allowed line-through'
                            )}
                          >
                            {size}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Low stock */}
                {isLowStock && (
                  <p className="text-xs font-heading font-semibold text-sale flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-sale" />
                    ¡Solo quedan {totalStock} {totalStock === 1 ? 'unidad' : 'unidades'}!
                  </p>
                )}

                {/* CTA */}
                <button
                  onClick={() => {
                    const size = qvSize ?? (uniqueSizes.length === 1 ? uniqueSizes[0] : null)
                    if (!size && uniqueSizes.length > 1) return
                    handleAddWithSize(size ?? '', qvColor)
                    setShowQuickView(false)
                  }}
                  disabled={uniqueSizes.length > 1 && !qvSize}
                  className="mt-auto w-full py-3 bg-black text-white font-heading font-bold text-sm tracking-widest rounded hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {uniqueSizes.length > 1 && !qvSize ? 'Selecciona una talla' : 'AGREGAR AL CARRITO'}
                </button>

                <Link
                  href={`/${slug}`}
                  onClick={() => setShowQuickView(false)}
                  className="text-xs text-center text-gray-text underline underline-offset-2 hover:text-black transition-colors"
                >
                  Ver página completa del producto →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
