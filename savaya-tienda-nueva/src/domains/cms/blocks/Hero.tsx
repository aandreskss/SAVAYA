import Image from 'next/image'
import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'hero'>

function HeadlineWithAccent({ text, accent }: { text: string; accent?: string }) {
  if (!accent) return <>{text}</>
  const parts = text.split(accent)
  if (parts.length < 2) return <>{text}</>
  return (
    <>
      {parts[0]}
      <span className="text-accent-gold">{accent}</span>
      {parts[1]}
    </>
  )
}

export function Hero({
  eyebrow,
  headline,
  headlineAccent,
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
    <section className="px-4 md:px-10 pt-4" aria-label={headline}>
      <div
        className="relative overflow-hidden rounded-[32px] w-full"
        style={{ height: 'clamp(440px, 66vh, 560px)' }}
      >
        <Image
          src={imageDesktopUrl}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, calc(100vw - 80px)"
          className="hidden object-cover object-center md:block"
        />
        <Image
          src={imageMobileUrl}
          alt={imageAlt}
          fill
          priority
          sizes="calc(100vw - 32px)"
          className="block object-cover object-center md:hidden"
        />

        {/* Dark overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: `rgba(0,0,0,${overlayOpacity ?? 0.45})` }}
        />

        {/* Subtle highlight top-left — adds depth */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/8 via-transparent to-transparent"
        />

        {/* Content — bottom left, fade-up on load */}
        <div className="absolute left-7 bottom-10 md:left-12 md:bottom-14 z-10 max-w-[520px] animate-[fadeUp_0.7s_ease-out_both]">
          {eyebrow && (
            <div className="flex items-center gap-2 mb-4 animate-[fadeUp_0.6s_ease-out_both]">
              <span className="block w-6 h-px bg-accent-gold shrink-0" aria-hidden="true" />
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-accent-gold">
                {eyebrow}
              </span>
            </div>
          )}

          <h1 className="font-display font-black text-[clamp(38px,6vw,66px)] leading-[0.93] text-white mb-5 uppercase tracking-tight">
            <HeadlineWithAccent text={headline} accent={headlineAccent} />
          </h1>

          {subheadline && (
            <p className="text-white/75 text-sm md:text-base mb-7 max-w-[400px]">
              {subheadline}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={ctaPrimaryHref}
              className="inline-flex items-center px-7 py-3.5 rounded-pill bg-accent-gold text-text-primary font-bold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            >
              {ctaPrimaryText}
            </Link>
            {ctaSecondaryText && ctaSecondaryHref && (
              <Link
                href={ctaSecondaryHref}
                className="inline-flex items-center px-7 py-3.5 rounded-pill border-[1.5px] border-white/70 text-white font-bold text-sm transition-all duration-200 hover:bg-white/10 hover:border-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
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
