'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { cloudinaryCoverLoader, cloudinaryContainLoader } from '@/lib/cloudinary'
import Badge from '@/components/ui/Badge'

interface ProductGalleryProps {
  images: string[]
  productName: string
  badge?: 'new' | 'sale' | null
  discountPct?: number | null
  /** When this changes (color switch), gallery resets to first image. */
  activeColor?: string | null
}

export default function ProductGallery({
  images,
  productName,
  badge,
  discountPct,
  activeColor,
}: ProductGalleryProps) {
  const safeImages = images.length > 0 ? images : ['']
  const [active, setActive] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const mainContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setActive(0) }, [activeColor])

  // Reset loaded state whenever the displayed image changes
  useEffect(() => { setImgLoaded(false) }, [active, activeColor])

  // On mount (and on src change), if the image is already cached the onLoad
  // event fires before React hydration and gets lost — detect it manually.
  useEffect(() => {
    const img = mainContainerRef.current?.querySelector('img')
    if (img?.complete && img.naturalWidth > 0) setImgLoaded(true)
  }, [active, activeColor])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 50) return
    if (delta < 0 && active < safeImages.length - 1) setActive(active + 1)
    if (delta > 0 && active > 0) setActive(active - 1)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Thumbnails — horizontal strip on mobile (order-2/below), vertical column on desktop (order-1/left) */}
      {safeImages.length > 1 && (
        <div className="order-2 lg:order-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-hidden lg:w-[4.5rem] shrink-0">
          {safeImages.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                'relative shrink-0 overflow-hidden rounded border-2 transition-colors',
                'w-14 h-[4.5rem] lg:w-[4.5rem] lg:h-24',
                i === active
                  ? 'border-black'
                  : 'border-transparent hover:border-gray-300',
              )}
            >
              {src && (
                <Image
                  loader={cloudinaryContainLoader}
                  src={src}
                  alt={`${productName} — miniatura ${i + 1}`}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div
        ref={mainContainerRef}
        className="order-1 lg:order-2 relative aspect-[3/4] flex-1 min-w-0 overflow-hidden rounded bg-gray-bg"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Skeleton visible while image loads */}
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 transition-opacity duration-300',
            imgLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-pulse',
          )}
        />

        {safeImages[active] && (
          <Image
            key={safeImages[active]}
            loader={cloudinaryContainLoader}
            src={safeImages[active]}
            alt={`${productName} — imagen ${active + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              'object-contain object-top transition-opacity duration-300',
              imgLoaded ? 'opacity-100' : 'opacity-0',
            )}
          />
        )}

        {/* Preload next 3 images so thumbnail navigation is instantánea */}
        {safeImages.slice(1, 4).map((src) =>
          src ? (
            <Image
              key={`pre-${src}`}
              loader={cloudinaryContainLoader}
              src={src}
              alt=""
              fill
              sizes="1px"
              aria-hidden
              className="sr-only"
            />
          ) : null,
        )}

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <Badge
              variant={badge}
              label={badge === 'sale' && discountPct ? `-${discountPct}%` : undefined}
            />
          </div>
        )}

        {/* Mobile counter */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 right-3 lg:hidden bg-black/60 text-white text-xs font-heading px-2.5 py-1 rounded-full pointer-events-none">
            {active + 1} / {safeImages.length}
          </div>
        )}

        {/* Mobile arrow buttons */}
        {safeImages.length > 1 && active > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setActive(active - 1) }}
            aria-label="Imagen anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 lg:hidden w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 2 4 7 9 12" />
            </svg>
          </button>
        )}
        {safeImages.length > 1 && active < safeImages.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setActive(active + 1) }}
            aria-label="Siguiente imagen"
            className="absolute right-2 top-1/2 -translate-y-1/2 lg:hidden w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="5 2 10 7 5 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
