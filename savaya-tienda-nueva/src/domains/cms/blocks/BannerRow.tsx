'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Banner } from '../repository'

type Props = {
  banners: Banner[]
}

export function BannerRow({ banners }: Props) {
  const [current, setCurrent] = useState(0)

  if (banners.length === 0) return null

  const banner = banners[current]

  return (
    <section className="relative w-full overflow-hidden bg-surface-2">
      {/* Image */}
      <div className="relative aspect-[16/7] w-full">
        <Image
          src={banner.imageDesktopUrl}
          alt={banner.title}
          fill
          className="object-cover hidden sm:block"
          sizes="100vw"
          priority={current === 0}
        />
        <Image
          src={banner.imageMobileUrl}
          alt={banner.title}
          fill
          className="object-cover sm:hidden"
          sizes="100vw"
          priority={current === 0}
        />

        {/* CTA overlay */}
        {banner.ctaText && banner.ctaUrl && (
          <div className="absolute inset-0 flex items-end justify-center pb-8 sm:pb-12">
            <Link
              href={banner.ctaUrl}
              className="px-8 py-3 bg-accent-gold font-sans font-medium text-sm tracking-wide hover:opacity-90 transition-opacity"
            >
              {banner.ctaText}
            </Link>
          </div>
        )}
      </div>

      {/* Dot navigation — only when multiple banners */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Prev / Next arrows — only when multiple banners */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c + 1) % banners.length)}
            aria-label="Banner siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </section>
  )
}
