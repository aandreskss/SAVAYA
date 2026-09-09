import Link from 'next/link'
import { ProductCard } from '@/shared/ui/ProductCard'
import type { BlockContent } from '../block-schemas'
import type { ProductCardProps } from '@/shared/ui'

type Props = BlockContent<'product_grid'> & {
  products: ProductCardProps[]
}

export function ProductGrid({
  eyebrow,
  title,
  subtitle,
  products,
  columns = '4',
  ctaText,
  ctaHref,
}: Props) {
  const gridClass =
    columns === '2'
      ? 'grid-cols-2'
      : columns === '3'
        ? 'grid-cols-2 md:grid-cols-3'
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

  return (
    <section className="max-w-screen-xl mx-auto px-4 md:px-10 py-12 md:py-16">
      {(eyebrow || title || subtitle) && (
        <div className="mb-8">
          {eyebrow && (
            <p className="text-xs uppercase tracking-widest text-text-secondary mb-2">{eyebrow}</p>
          )}
          {title && (
            <h2 className="font-display text-[28px] md:text-[34px] uppercase tracking-tight text-text-primary">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
      )}

      {products.length > 0 ? (
        <div className={`grid ${gridClass} gap-4 md:gap-6`}>
          {products.map((p, index) => (
            <ProductCard key={p.id} {...p} priority={index < 4} />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-text-secondary py-16">
          No hay productos disponibles en este momento.
        </p>
      )}

      {ctaText && ctaHref && (
        <div className="mt-10 text-center">
          <Link
            href={ctaHref}
            className="btn-secondary inline-flex items-center gap-2 px-8 py-3"
          >
            {ctaText}
          </Link>
        </div>
      )}
    </section>
  )
}
