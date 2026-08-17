import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'promo_banner'>

export function PromoBanner({ headline, subheadline, ctaText, ctaHref }: Props) {
  return (
    <section className="px-4 md:px-10 pb-9">
      <div className="bg-accent-gold rounded-[32px] px-8 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="font-display font-black text-[28px] md:text-[34px] uppercase tracking-tight text-brand-black leading-[1.02]">
            {headline}
          </h2>
          {subheadline && (
            <p className="font-sans text-sm font-semibold text-brand-black/80 mt-1">
              {subheadline}
            </p>
          )}
        </div>
        <Link
          href={ctaHref}
          className="shrink-0 inline-flex items-center justify-center px-7 py-3.5 rounded-pill bg-brand-black text-brand-white font-sans text-sm font-bold hover:bg-brand-black/85 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-brand-white focus-visible:outline-offset-2"
        >
          {ctaText}
        </Link>
      </div>
    </section>
  )
}
