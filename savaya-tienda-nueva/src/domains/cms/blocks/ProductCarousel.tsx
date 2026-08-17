'use client'

import { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ProductCard } from '@/shared/ui'
import type { ProductCardProps } from '@/shared/ui'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'product_carousel'> & {
  products: ProductCardProps[]
}

function ChevronLeft() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M12.5 5L7.5 10L12.5 15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M7.5 5L12.5 10L7.5 15"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const SCROLL_AMOUNT = 320 // px per arrow click

export function ProductCarousel({
  title,
  subtitle,
  products,
  ctaText,
  ctaHref,
  bgVariant = 'default',
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
  }

  if (products.length === 0) return null

  const isSand = bgVariant === 'sand'

  return (
    <section className={isSand ? 'mx-4 md:mx-10 my-9 bg-surface-2 rounded-[32px] px-6 md:px-10 py-9' : 'px-4 md:px-10 py-6'}>
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-[28px] md:text-[30px] uppercase tracking-tight text-text-primary">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 font-sans text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>

        {ctaText && ctaHref && (
          <Link
            href={ctaHref}
            className="shrink-0 font-sans text-sm font-bold text-text-primary underline underline-offset-4 hover:text-accent-gold transition-colors"
          >
            {ctaText}
          </Link>
        )}
      </div>

      {/* Grid on desktop, carousel on mobile + nav arrows */}
      <div className="relative">
        {/* Arrow left — desktop only */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Productos anteriores"
            className="
              absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2
              h-10 w-10 items-center justify-center rounded-full
              bg-brand-white shadow-md border border-border
              text-text-primary hover:bg-surface-2 transition-colors
              md:flex
            "
          >
            <ChevronLeft />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="
            flex gap-4 overflow-x-auto pb-4
            snap-x snap-mandatory scroll-smooth scrollbar-hide
            md:grid md:grid-cols-4 md:gap-6
            md:overflow-visible md:pb-0
          "
        >
          {products.map((product, i) => (
            <div
              key={product.id}
              className="shrink-0 snap-start w-[56vw] max-w-[260px] md:w-auto md:max-w-none"
            >
              <ProductCard {...product} priority={i < 4} />
            </div>
          ))}
        </div>

        {/* Arrow right — desktop only */}
        {canScrollRight && (
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Más productos"
            className="
              absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2
              h-10 w-10 items-center justify-center rounded-full
              bg-brand-white shadow-md border border-border
              text-text-primary hover:bg-surface-2 transition-colors
              md:flex
            "
          >
            <ChevronRight />
          </button>
        )}
      </div>
    </section>
  )
}
