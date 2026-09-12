'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from './Badge'
import { Price } from './Price'
import { cn } from '@/shared/lib/utils'

type ProductBadge = 'new' | 'bestseller' | 'sale' | 'low_stock' | 'web_exclusive'

export type ProductCardProps = {
  id: string
  slug: string
  name: string
  basePrice: number
  compareAtPrice?: number | null
  currency?: string
  images: { url: string; alt: string; colorId?: string | null }[]
  availableColors: { id: string; name: string; hex: string; hex2?: string | null }[]
  badges?: ProductBadge[]
  isVip?: boolean
  isInWishlist?: boolean
  onWishlistToggle?: (id: string) => void
  priority?: boolean
}

const BADGE_CONFIG: Record<ProductBadge, { label: string; variant: 'default' | 'gold' | 'success' | 'warning' | 'error' | 'outline' }> = {
  new: { label: 'Nuevo', variant: 'default' },
  bestseller: { label: 'Más Vendido', variant: 'gold' },
  sale: { label: 'Oferta', variant: 'error' },
  low_stock: { label: 'Últimas Unidades', variant: 'warning' },
  web_exclusive: { label: 'Solo Online', variant: 'outline' },
}

const MAX_COLORS = 5

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'}>
      <path
        d="M10 17s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 17 8c0 4.5-7 9-7 9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ProductCard({
  id,
  slug,
  name,
  basePrice,
  compareAtPrice,
  currency = 'USD',
  images,
  availableColors,
  badges,
  isVip = false,
  isInWishlist = false,
  onWishlistToggle,
  priority = false,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedColorId, setSelectedColorId] = useState<string | undefined>(
    availableColors[0]?.id,
  )

  const visibleColors = availableColors.slice(0, MAX_COLORS)
  const extraColors = availableColors.length - MAX_COLORS

  const discountBadge =
    compareAtPrice && compareAtPrice > basePrice
      ? `-${Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)}%`
      : undefined

  // Images for the active color — fall back to first product images if no color match
  const colorImages = selectedColorId
    ? images.filter((img) => img.colorId === selectedColorId)
    : []
  const mainImage = colorImages[0] ?? images[0]
  const hoverImage = colorImages[1] ?? images[1]

  const firstBadge = badges?.[0]

  return (
    <div className="group relative flex flex-col gap-3">
      <Link
        href={`/producto/${slug}`}
        className="relative focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 rounded-[24px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Imagen */}
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-[24px] bg-surface-2',
            isVip && 'ring-2 ring-[#CA8C31] ring-offset-2 ring-offset-background',
          )}
          style={{ aspectRatio: '1/1' }}
        >
          {/* VIP Badge */}
          {isVip && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 bg-[#CA8C31] text-[#0C0C08] text-[10px] font-extrabold px-2.5 py-1 rounded-pill">
                ★ VIP
              </span>
            </div>
          )}

          {/* Regular badge (only if not VIP) */}
          {!isVip && firstBadge && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-block bg-brand-black text-white text-[10px] font-extrabold px-2.5 py-1 rounded-pill">
                {BADGE_CONFIG[firstBadge].label.toUpperCase()}
              </span>
            </div>
          )}

          {/* Imagen principal */}
          {mainImage && (
            <Image
              src={mainImage.url}
              alt={mainImage.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={priority}
              className={cn(
                'object-cover transition-all duration-300 group-hover:scale-[1.04]',
                hoverImage && isHovered ? 'opacity-0' : 'opacity-100',
              )}
            />
          )}

          {/* Imagen hover — desktop only */}
          {hoverImage && (
            <Image
              src={hoverImage.url}
              alt={hoverImage.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={cn(
                'object-cover transition-all duration-300 hidden md:block group-hover:scale-[1.04]',
                isHovered ? 'opacity-100' : 'opacity-0',
              )}
            />
          )}

          {/* "Ver producto" overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden md:block"
          >
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-[14px] bg-surface/88 backdrop-blur-sm border border-border/50">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-text-primary">
                Ver Producto
              </span>
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1 6.5h11M7 1.5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-gold" />
              </svg>
            </div>
          </div>
        </div>
      </Link>

      {/* Wishlist FAB — top-right, over image */}
      {onWishlistToggle && (
        <button
          type="button"
          aria-label={isInWishlist ? `Quitar ${name} de favoritos` : `Agregar ${name} a favoritos`}
          onClick={() => onWishlistToggle(id)}
          className={cn(
            'absolute top-2.5 right-2.5 z-10',
            'flex items-center justify-center w-8 h-8 rounded-full',
            'bg-brand-white shadow-sm border border-border',
            'text-text-secondary hover:text-text-primary transition-all duration-150',
            'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
            'md:opacity-0 md:group-hover:opacity-100',
            isInWishlist && 'text-error md:opacity-100',
          )}
        >
          <HeartIcon filled={isInWishlist} />
        </button>
      )}

      {/* Info — nombre, colores y precio fuera del mismo link para que los botones de color sean válidos */}
      <div className="flex flex-col gap-1.5 px-0.5">
        <Link href={`/producto/${slug}`} className="block">
          <p className="font-sans text-[13px] font-bold text-text-primary leading-snug line-clamp-2 hover:text-text-primary/80 transition-colors">
            {name}
          </p>
        </Link>

        {/* Colores interactivos */}
        {visibleColors.length > 0 && (
          <div className="flex items-center gap-2" aria-label="Colores disponibles">
            {visibleColors.map((color) => {
              const isSelected = color.id === selectedColorId
              return (
                <button
                  key={color.id}
                  type="button"
                  title={color.name}
                  aria-label={`Color: ${color.name}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedColorId(color.id)}
                  className={cn(
                    'inline-block w-[18px] h-[18px] rounded-full shrink-0 transition-all duration-150',
                    'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-1',
                    isSelected
                      ? 'shadow-[0_0_0_1.5px_rgba(0,0,0,0.08),0_0_0_3px_#C9A227,0_0_0_4.5px_rgba(0,0,0,0.06)]'
                      : 'shadow-[0_0_0_1.5px_rgba(0,0,0,0.13),0_1px_3px_rgba(0,0,0,0.10)] hover:shadow-[0_0_0_1.5px_rgba(0,0,0,0.13),0_0_0_3px_rgba(201,162,39,0.4)]',
                  )}
                  style={
                    color.hex2
                      ? { background: `linear-gradient(135deg, ${color.hex} 50%, ${color.hex2} 50%)` }
                      : { backgroundColor: color.hex }
                  }
                />
              )
            })}
            {extraColors > 0 && (
              <span className="font-sans text-[11px] text-text-secondary leading-none">
                +{extraColors}
              </span>
            )}
          </div>
        )}

        <Link href={`/producto/${slug}`} className="block">
          <Price
            amount={basePrice}
            currency={currency}
            compareAtAmount={compareAtPrice ?? undefined}
            discountBadge={discountBadge}
            size="sm"
          />
        </Link>
      </div>
    </div>
  )
}
