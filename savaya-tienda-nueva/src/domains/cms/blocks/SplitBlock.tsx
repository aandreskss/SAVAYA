import Image from 'next/image'
import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'split_block'>

function CornerMarks() {
  return (
    <>
      <span className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-white/50 pointer-events-none" aria-hidden="true" />
      <span className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-white/50 pointer-events-none" aria-hidden="true" />
      <span className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-white/50 pointer-events-none" aria-hidden="true" />
      <span className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-white/50 pointer-events-none" aria-hidden="true" />
    </>
  )
}

function SplitPanel({
  eyebrow,
  label,
  href,
  imageUrl,
  showMark,
}: {
  eyebrow?: string
  label: string
  href: string
  imageUrl: string
  showMark?: boolean
}) {
  return (
    <Link
      href={href}
      className="
        group relative flex-1 min-h-[320px] md:min-h-[440px] overflow-hidden rounded-[32px]
        focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2
      "
    >
      <Image
        src={imageUrl}
        alt={label}
        fill
        sizes="(max-width: 768px) calc(100vw - 32px), calc(50vw - 48px)"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.58) 0%, transparent 52%)' }}
      />

      <CornerMarks />

      {showMark && (
        <span className="absolute top-6 right-7 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
          SVY
        </span>
      )}

      <div className="absolute left-7 bottom-7 z-10">
        {eyebrow && (
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-white/65 mb-1.5">
            {eyebrow}
          </p>
        )}
        <h3 className="font-display font-black text-[32px] text-white uppercase leading-none mb-2.5">
          {label}
        </h3>
        <span className="font-sans text-xs font-semibold text-white/80 underline underline-offset-4">
          Descubrir colección
        </span>
      </div>
    </Link>
  )
}

export function SplitBlock({
  leftEyebrow,
  leftLabel,
  leftHref,
  leftImageUrl,
  rightEyebrow,
  rightLabel,
  rightHref,
  rightImageUrl,
  rightShowMark,
}: Props) {
  return (
    <section
      className="px-4 md:px-10 py-6 flex flex-col md:flex-row gap-4"
      aria-label="Explora por género"
    >
      <SplitPanel eyebrow={leftEyebrow} label={leftLabel} href={leftHref} imageUrl={leftImageUrl} />
      <SplitPanel eyebrow={rightEyebrow} label={rightLabel} href={rightHref} imageUrl={rightImageUrl} showMark={rightShowMark} />
    </section>
  )
}
