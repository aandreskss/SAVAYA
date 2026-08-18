import Image from 'next/image'
import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'editorial_block'>

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

function CornerMarks({ color = 'text-text-primary/15' }: { color?: string }) {
  return (
    <>
      <span className={`absolute top-5 left-5 w-5 h-5 border-t-2 border-l-2 ${color} pointer-events-none`} aria-hidden="true" />
      <span className={`absolute top-5 right-5 w-5 h-5 border-t-2 border-r-2 ${color} pointer-events-none`} aria-hidden="true" />
      <span className={`absolute bottom-5 left-5 w-5 h-5 border-b-2 border-l-2 ${color} pointer-events-none`} aria-hidden="true" />
      <span className={`absolute bottom-5 right-5 w-5 h-5 border-b-2 border-r-2 ${color} pointer-events-none`} aria-hidden="true" />
    </>
  )
}

export function EditorialBlock({
  variant = 'overlay',
  eyebrow,
  headline,
  headlineAccent,
  body,
  ctaText,
  ctaHref,
  imageUrl,
  imageAlt,
  imagePosition,
}: Props) {
  if (variant === 'split') {
    const textFirst = imagePosition !== 'left'

    return (
      <section className="px-4 md:px-10 py-6">
        <div className="overflow-hidden rounded-[32px] flex flex-col md:flex-row min-h-[400px] md:min-h-[480px]">
          {/* Text panel */}
          <div
            className={`relative flex-1 bg-surface-2 flex items-center p-9 md:p-14 ${textFirst ? 'order-first' : 'order-last'}`}
          >
            <CornerMarks />
            <div className="relative z-10 max-w-[400px]">
              {eyebrow && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="block w-4 h-px bg-accent-gold shrink-0" aria-hidden="true" />
                  <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-accent-gold">
                    {eyebrow}
                  </span>
                </div>
              )}
              <h2 className="font-display font-black text-[clamp(28px,3.5vw,42px)] uppercase tracking-tight text-text-primary leading-[1.02] mb-4">
                <HeadlineWithAccent text={headline} accent={headlineAccent} />
              </h2>
              <p className="font-sans text-sm text-text-secondary leading-relaxed mb-7">
                {body}
              </p>
              {ctaText && ctaHref && (
                <Link
                  href={ctaHref}
                  className="inline-flex items-center px-7 py-3.5 rounded-pill bg-accent-gold text-brand-black font-bold text-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2"
                >
                  {ctaText}
                </Link>
              )}
            </div>
          </div>

          {/* Image panel */}
          <div
            className={`relative flex-1 min-h-[280px] md:min-h-0 ${textFirst ? 'order-last' : 'order-first'}`}
          >
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) calc(100vw - 32px), calc(50vw - 40px)"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>
    )
  }

  // variant === 'overlay'
  const textLeft = imagePosition !== 'right'

  return (
    <section className="px-4 md:px-10 py-6">
      <div className="relative overflow-hidden rounded-[32px] w-full min-h-[380px] md:min-h-[420px] flex items-center">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) calc(100vw - 32px), calc(100vw - 80px)"
          className="object-cover object-center"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: textLeft
              ? 'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 55%, transparent 80%)'
              : 'linear-gradient(270deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 55%, transparent 80%)',
          }}
        />

        <div
          className="relative z-10 max-w-[460px]"
          style={{
            padding: '0 3.5rem',
            marginLeft: textLeft ? 0 : 'auto',
            marginRight: textLeft ? 'auto' : 0,
          }}
        >
          {eyebrow && (
            <div className="flex items-center gap-2 mb-4">
              <span className="block w-4 h-px bg-accent-gold shrink-0" aria-hidden="true" />
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-accent-gold">
                {eyebrow}
              </span>
            </div>
          )}

          <h2 className="font-display font-black text-3xl md:text-[42px] text-white uppercase leading-[1.02] mb-3">
            <HeadlineWithAccent text={headline} accent={headlineAccent} />
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
