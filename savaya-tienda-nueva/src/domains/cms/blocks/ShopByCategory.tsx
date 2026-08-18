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
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr)',
            gridTemplateRows: '240px 240px',
          }}
        >
          {categories.slice(0, 5).map((cat, i) => (
            <CategoryCard
              key={cat.slug}
              cat={cat}
              sizes={
                i === 0
                  ? '(max-width: 768px) calc(100vw - 32px), calc((100vw - 80px) * 0.45)'
                  : '(max-width: 768px) calc(100vw - 32px), calc((100vw - 80px) * 0.27)'
              }
              className={i === 0 ? '[grid-row:span_2]' : ''}
            />
          ))}
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${Math.min(count, 3)}, minmax(0, 1fr))`,
          }}
        >
          {categories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              cat={cat}
              sizes="(max-width: 768px) calc(100vw - 32px), calc((100vw - 80px) / 3)"
              className="min-h-[220px]"
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
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-surface-2" />
      )}

      {/* Gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.52) 0%, transparent 55%)' }}
      />

      {/* Label */}
      <span className="absolute left-5 bottom-4 font-display font-black text-lg text-white uppercase z-10 tracking-wide">
        {cat.name}
      </span>
    </Link>
  )
}
