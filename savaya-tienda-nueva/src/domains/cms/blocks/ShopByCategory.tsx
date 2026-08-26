import Image from 'next/image'
import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'shop_by_category'>

export function ShopByCategory({ eyebrow, title, ctaText, ctaHref, categories }: Props) {
  const count = categories.length
  const bento = count >= 4

  return (
    <section className="px-4 md:px-10 py-8">
      {/* Section header */}
      <div className="mb-6">
        {eyebrow && (
          <div className="flex items-center gap-2 mb-2">
            <span className="block w-4 h-px bg-accent-gold shrink-0" aria-hidden="true" />
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-accent-gold">
              {eyebrow}
            </span>
          </div>
        )}
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display font-black text-[clamp(28px,4vw,40px)] uppercase tracking-tight text-text-primary leading-[1.05]">
            {title}
          </h2>
          {ctaText && ctaHref && (
            <Link
              href={ctaHref}
              className="shrink-0 font-sans text-sm font-semibold text-accent-gold hover:underline underline-offset-4 transition-colors"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>

      {/* Bento grid: 1 large left + 2×2 right (for 4+ categories) */}
      {bento ? (
        <div className="grid gap-3 sm:gap-4
          grid-cols-2
          [grid-template-rows:200px_155px_155px]
          sm:[grid-template-columns:minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]
          sm:[grid-template-rows:240px_240px]
        ">
          {categories.slice(0, 5).map((cat, i) => (
            <CategoryCard
              key={cat.slug}
              cat={cat}
              sizes={
                i === 0
                  ? '(max-width: 640px) calc(100vw - 32px), (max-width: 768px) calc(100vw - 32px), calc((100vw - 80px) * 0.45)'
                  : '(max-width: 640px) calc(50vw - 20px), (max-width: 768px) calc(50vw - 20px), calc((100vw - 80px) * 0.27)'
              }
              className={i === 0 ? 'col-span-2 sm:col-span-1 sm:[grid-row:span_2]' : ''}
            />
          ))}
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-4 ${
          count === 1 ? 'grid-cols-1' :
          count === 2 ? 'grid-cols-2' :
          'grid-cols-2 sm:grid-cols-3'
        }`}>
          {categories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              cat={cat}
              sizes="(max-width: 640px) calc(50vw - 20px), (max-width: 768px) calc(50vw - 20px), calc((100vw - 80px) / 3)"
              className="min-h-[180px] sm:min-h-[220px]"
            />
          ))}
        </div>
      )}
    </section>
  )
}

function CategoryCard({
  cat,
  sizes,
  className = '',
}: {
  cat: { name: string; slug: string; imageUrl: string }
  sizes: string
  className?: string
}) {
  return (
    <Link
      href={`/categoria/${cat.slug}`}
      className={`group relative overflow-hidden rounded-[24px] focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2 ${className}`}
    >
      {cat.imageUrl ? (
        <Image
          src={cat.imageUrl}
          alt={cat.name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-surface-2" />
      )}

      {/* Base gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.05) 60%)' }}
      />
      {/* Hover darkening overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />

      {/* Label + reveal CTA */}
      <div className="absolute left-5 bottom-0 z-10 pb-5">
        <span className="block font-display font-black text-xl text-white uppercase tracking-wide drop-shadow-sm">
          {cat.name}
        </span>
        <div className="flex items-center gap-2 mt-1.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-75">
          <span className="block w-5 h-px bg-accent-gold shrink-0" aria-hidden="true" />
          <span className="font-sans text-[11px] font-bold text-accent-gold uppercase tracking-[0.14em]">
            Explorar
          </span>
        </div>
      </div>
    </Link>
  )
}
