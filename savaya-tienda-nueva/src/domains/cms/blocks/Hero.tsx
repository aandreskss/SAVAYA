import Image from 'next/image'
import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'hero'>

export function Hero({
  headline,
  subheadline,
  ctaPrimaryText,
  ctaPrimaryHref,
  ctaSecondaryText,
  ctaSecondaryHref,
  imageDesktopUrl,
  imageMobileUrl,
  imageAlt,
  overlayOpacity,
}: Props) {
  return (
    <section
      className="px-4 md:px-10 pt-4"
      aria-label={headline}
    >
      <div
        className="relative overflow-hidden rounded-[32px] w-full"
        style={{ height: 'clamp(420px, 62vh, 520px)' }}
      >
        {/* Background image — desktop */}
        <Image
          src={imageDesktopUrl}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 80px)"
          className="hidden object-cover object-center md:block"
        />

        {/* Background image — mobile */}
        <Image
          src={imageMobileUrl}
          alt={imageAlt}
          fill
          priority
          sizes="calc(100vw - 32px)"
          className="block object-cover object-center md:hidden"
        />

        {/* Bottom gradient overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 45%)',
            opacity: overlayOpacity ?? 1,
          }}
        />

        {/* Content — bottom left */}
        <div className="absolute left-6 bottom-8 md:left-12 md:bottom-12 z-10 max-w-[560px]">
          <h1 className="font-display font-black text-3xl md:text-5xl leading-[0.98] text-white mb-4 uppercase tracking-tight">
            {headline}
          </h1>

          {subheadline && (
            <p className="text-[#F1EFEA] text-sm md:text-base mb-6 max-w-[420px]">
              {subheadline}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={ctaPrimaryHref}
              className="inline-flex items-center px-6 py-3.5 rounded-pill bg-white text-brand-black font-bold text-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2"
            >
              {ctaPrimaryText}
            </Link>

            {ctaSecondaryText && ctaSecondaryHref && (
              <Link
                href={ctaSecondaryHref}
                className="inline-flex items-center px-6 py-3.5 rounded-pill border-[1.5px] border-white text-white font-bold text-sm transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2"
              >
                {ctaSecondaryText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
