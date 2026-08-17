'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GalleryImage = {
  url: string
  altText: string | null
  variantId: string | null
  type: 'image' | 'video'
}

export type ProductGalleryProps = {
  images: GalleryImage[]
  selectedVariantId?: string
  productName: string
}

// ---------------------------------------------------------------------------
// ProductGallery
// ---------------------------------------------------------------------------

export function ProductGallery({ images, selectedVariantId, productName }: ProductGalleryProps) {
  // manualIndex: index chosen by the user clicking thumbnails/dots
  // If null, we compute the active index from selectedVariantId
  const [manualIndex, setManualIndex] = useState<number | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Compute the active index:
  // 1. If the user manually picked an image, use that
  // 2. If a variant is selected and has a dedicated image, use its first image
  // 3. Otherwise default to 0
  const variantImageIndex = selectedVariantId
    ? images.findIndex((img) => img.variantId === selectedVariantId)
    : -1
  const activeIndex =
    manualIndex !== null
      ? manualIndex
      : variantImageIndex !== -1
        ? variantImageIndex
        : 0

  // Reset manual selection whenever the variant changes (so we jump to the variant image)
  const prevVariantIdRef = useRef(selectedVariantId)
  useEffect(() => {
    if (selectedVariantId !== prevVariantIdRef.current) {
      prevVariantIdRef.current = selectedVariantId
      setManualIndex(null)
    }
  }, [selectedVariantId])

  // Sync carousel scroll position on index change (mobile)
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return
    const slide = carousel.children[activeIndex] as HTMLElement | undefined
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    }
  }, [activeIndex])

  // Track scroll position in carousel to update dots (mobile swipe)
  const handleCarouselScroll = useCallback(() => {
    const carousel = carouselRef.current
    if (!carousel) return
    const scrollLeft = carousel.scrollLeft
    const width = carousel.clientWidth
    if (width === 0) return
    const newIndex = Math.round(scrollLeft / width)
    setManualIndex(newIndex)
  }, [])

  if (images.length === 0) {
    return (
      <div
        className="w-full bg-surface-2 rounded-lg flex items-center justify-center"
        style={{ aspectRatio: '3/4' }}
        aria-label={`Sin imágenes de ${productName}`}
      >
        <span className="font-sans text-sm text-text-secondary">Sin imágenes</span>
      </div>
    )
  }

  const activeImage = images[activeIndex]

  return (
    <div className="flex flex-col gap-4">
      {/* ── DESKTOP layout ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex gap-4">
        {/* Thumbnails — vertical strip on the left */}
        {images.length > 1 && (
          <div
            className="flex flex-col gap-2 w-[72px] shrink-0 overflow-y-auto max-h-[640px]"
            style={{ scrollbarWidth: 'thin' }}
            role="list"
            aria-label="Miniaturas del producto"
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={img.altText ?? `${productName} imagen ${idx + 1}`}
                aria-current={idx === activeIndex ? true : undefined}
                onClick={() => setManualIndex(idx)}
                className={cn(
                  'relative w-[72px] shrink-0 rounded overflow-hidden border-2 transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                  idx === activeIndex
                    ? 'border-accent-gold'
                    : 'border-transparent hover:border-border',
                )}
                style={{ aspectRatio: '3/4' }}
              >
                {img.type === 'video' ? (
                  <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                    <PlayIcon />
                  </div>
                ) : (
                  <Image
                    src={img.url}
                    alt={img.altText ?? `${productName} imagen ${idx + 1}`}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main image — zoom on hover */}
        <div
          className={cn(
            'relative flex-1 rounded-2xl overflow-hidden bg-surface-2',
            'cursor-crosshair',
          )}
          style={{ aspectRatio: '3/4' }}
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          aria-label={activeImage.altText ?? productName}
        >
          {activeImage.type === 'video' ? (
            <video
              src={activeImage.url}
              controls
              className="absolute inset-0 w-full h-full object-cover"
              aria-label={activeImage.altText ?? `Video de ${productName}`}
            />
          ) : (
            <Image
              src={activeImage.url}
              alt={activeImage.altText ?? productName}
              fill
              sizes="(max-width: 1280px) 50vw, 640px"
              priority={activeIndex === 0}
              className={cn(
                'object-cover transition-transform duration-300',
                isZoomed ? 'scale-150' : 'scale-100',
              )}
            />
          )}
        </div>
      </div>

      {/* ── MOBILE layout — horizontal scroll carousel ───────────────────── */}
      <div className="md:hidden flex flex-col gap-3">
        <div
          ref={carouselRef}
          role="region"
          aria-label={`Galería de ${productName}`}
          onScroll={handleCarouselScroll}
          className={cn(
            'flex overflow-x-auto',
            'snap-x snap-mandatory',
            'rounded-2xl',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative w-full shrink-0 snap-start"
              style={{ aspectRatio: '3/4' }}
            >
              {img.type === 'video' ? (
                <video
                  src={img.url}
                  controls
                  className="absolute inset-0 w-full h-full object-cover"
                  aria-label={img.altText ?? `Video de ${productName}`}
                />
              ) : (
                <Image
                  src={img.url}
                  alt={img.altText ?? `${productName} imagen ${idx + 1}`}
                  fill
                  sizes="100vw"
                  priority={idx === 0}
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {/* Dots navigation */}
        {images.length > 1 && (
          <div
            className="flex justify-center gap-1.5"
            role="group"
            aria-label="Navegación de imágenes"
          >
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Imagen ${idx + 1} de ${images.length}`}
                aria-current={idx === activeIndex ? true : undefined}
                onClick={() => setManualIndex(idx)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  'focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2',
                  idx === activeIndex
                    ? 'bg-accent-gold w-4'
                    : 'bg-border hover:bg-text-secondary',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PlayIcon — for video thumbnails
// ---------------------------------------------------------------------------

function PlayIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="currentColor" />
    </svg>
  )
}
