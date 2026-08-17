import Image from 'next/image'
import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'split_block'>

function SplitPanel({
  label,
  href,
  imageUrl,
  ctaLabel,
}: {
  label: string
  href: string
  imageUrl: string
  ctaLabel?: string
}) {
  return (
    <Link
      href={href}
      className="
        group relative flex-1 min-h-[320px] md:min-h-[420px] overflow-hidden rounded-[32px]
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

      {/* Bottom gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.55), transparent 50%)' }}
      />

      {/* Label */}
      <div className="absolute left-7 bottom-7 z-10">
        <h3 className="font-display font-black text-3xl text-white uppercase mb-2">
          {label}
        </h3>
        <span className="text-white text-sm font-semibold underline underline-offset-2">
          {ctaLabel ?? 'Descubrir colección'}
        </span>
      </div>
    </Link>
  )
}

export function SplitBlock({ leftLabel, leftHref, leftImageUrl, rightLabel, rightHref, rightImageUrl }: Props) {
  return (
    <section
      className="px-4 md:px-10 py-6 flex flex-col md:flex-row gap-5"
      aria-label="Explora por género"
    >
      <SplitPanel label={leftLabel} href={leftHref} imageUrl={leftImageUrl} />
      <SplitPanel label={rightLabel} href={rightHref} imageUrl={rightImageUrl} />
    </section>
  )
}
