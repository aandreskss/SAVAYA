import Image from 'next/image'
import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'editorial_block'>

export function EditorialBlock({
  eyebrow,
  headline,
  body,
  ctaText,
  ctaHref,
  imageUrl,
  imageAlt,
  imagePosition,
}: Props) {
  const textLeft = imagePosition !== 'right'

  return (
    <section className="px-4 md:px-10 py-6">
      <div className="relative overflow-hidden rounded-[32px] w-full min-h-[380px] md:min-h-[420px] flex items-center">
        {/* Background image */}
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) calc(100vw - 32px), calc(100vw - 80px)"
          className="object-cover object-center"
        />

        {/* Gradient overlay — direction based on text position */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: textLeft
              ? 'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 55%, transparent 80%)'
              : 'linear-gradient(270deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 55%, transparent 80%)',
          }}
        />

        {/* Content */}
        <div
          className="relative z-10 max-w-[460px]"
          style={{
            padding: '0 3.5rem',
            marginLeft: textLeft ? 0 : 'auto',
            marginRight: textLeft ? 'auto' : 0,
          }}
        >
          {eyebrow && (
            <p className="text-accent-gold text-xs font-bold uppercase tracking-[0.12em] mb-3">
              {eyebrow}
            </p>
          )}

          <h2 className="font-display font-black text-3xl md:text-[42px] text-white uppercase leading-[1.02] mb-3">
            {headline}
          </h2>

          <p className="text-[#F1EFEA] text-sm md:text-[15px] mb-6 leading-relaxed">
            {body}
          </p>

          {ctaText && ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex items-center px-7 py-3.5 rounded-pill bg-accent-gold text-brand-black font-bold text-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
