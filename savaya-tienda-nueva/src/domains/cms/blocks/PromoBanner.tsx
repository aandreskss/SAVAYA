import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'promo_banner'>

export function PromoBanner({ eyebrow, headline, subheadline, ctaText, ctaHref }: Props) {
  return (
    <section className="px-4 md:px-10 pb-9">
      <div
        className="rounded-[32px] px-8 md:px-14 py-10 md:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{ background: 'linear-gradient(105deg, #D4A820 0%, #C9A227 45%, #A87A10 100%)' }}
      >
        <div>
          {eyebrow && (
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-text-primary/70 mb-2">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display font-black text-[clamp(26px,4vw,38px)] uppercase tracking-tight text-text-primary leading-[1.02]">
            {headline}
          </h2>
          {subheadline && (
            <p className="font-sans text-sm text-text-primary/75 mt-1.5 max-w-[340px]">
              {subheadline}
            </p>
          )}
        </div>
        <Link
          href={ctaHref}
          className="shrink-0 inline-flex items-center justify-center px-7 py-3.5 rounded-pill bg-text-primary text-surface font-sans text-sm font-bold hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
        >
          {ctaText}
        </Link>
      </div>
    </section>
  )
}
