import Image from 'next/image'
import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'social_proof_grid'>

function ButterflyDecoration() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="14"
      viewBox="0 0 36 28"
      fill="none"
      className="shrink-0"
    >
      <path
        d="M18 14C18 14 8 4 2 6C-2 7.5 1 16 6 18C10 19.5 18 14 18 14Z"
        fill="url(#gold-l)"
      />
      <path
        d="M18 14C18 14 28 4 34 6C38 7.5 35 16 30 18C26 19.5 18 14 18 14Z"
        fill="url(#gold-r)"
      />
      <path
        d="M18 14C18 14 10 20 8 26C7 29 12 29 15 27C17 25.5 18 14 18 14Z"
        fill="url(#gold-bl)"
        opacity="0.8"
      />
      <path
        d="M18 14C18 14 26 20 28 26C29 29 24 29 21 27C19 25.5 18 14 18 14Z"
        fill="url(#gold-br)"
        opacity="0.8"
      />
      <defs>
        <linearGradient id="gold-l" x1="2" y1="6" x2="18" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4A820" />
          <stop offset="1" stopColor="#C9A227" />
        </linearGradient>
        <linearGradient id="gold-r" x1="34" y1="6" x2="18" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4A820" />
          <stop offset="1" stopColor="#C9A227" />
        </linearGradient>
        <linearGradient id="gold-bl" x1="8" y1="26" x2="18" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A87A10" />
          <stop offset="1" stopColor="#C9A227" />
        </linearGradient>
        <linearGradient id="gold-br" x1="28" y1="26" x2="18" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A87A10" />
          <stop offset="1" stopColor="#C9A227" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function SocialProofGrid({ heading, images }: Props) {
  return (
    <section className="px-4 md:px-10 py-10">
      {/* Heading */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex items-center gap-3 w-full max-w-[200px]">
          <span className="flex-1 h-px bg-accent-gold" aria-hidden="true" />
          <ButterflyDecoration />
          <span className="flex-1 h-px bg-accent-gold" aria-hidden="true" />
        </div>
        <h2 className="font-display font-black text-[clamp(20px,3vw,30px)] uppercase tracking-tight text-text-primary text-center">
          {heading}
        </h2>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((img, i) => {
          const inner = (
            <div className="relative aspect-square overflow-hidden rounded-[20px] group">
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) calc(50vw - 24px), calc(25vw - 28px)"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )

          return img.href ? (
            <Link
              key={i}
              href={img.href}
              className="block rounded-[20px] focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2"
            >
              {inner}
            </Link>
          ) : (
            <div key={i}>{inner}</div>
          )
        })}
      </div>
    </section>
  )
}
