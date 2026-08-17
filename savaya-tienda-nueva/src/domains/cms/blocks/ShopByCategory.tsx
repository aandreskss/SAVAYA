import Image from 'next/image'
import Link from 'next/link'
import type { BlockContent } from '../block-schemas'

type Props = BlockContent<'shop_by_category'>

export function ShopByCategory({ title, categories }: Props) {
  const count = categories.length

  return (
    <section className="px-4 md:px-10 py-6">
      {title && (
        <h2 className="font-display font-extrabold text-[28px] md:text-[30px] uppercase tracking-tight text-text-primary mb-5">
          {title}
        </h2>
      )}

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.min(count, 3)}, minmax(0, 1fr))`,
        }}
      >
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categoria/${category.slug}`}
            className="
              group relative overflow-hidden rounded-[28px] min-h-[220px]
              focus-visible:outline-2 focus-visible:outline-accent-gold focus-visible:outline-offset-2
            "
          >
            {category.imageUrl ? (
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                sizes="(max-width: 768px) calc(100vw - 32px), calc((100vw - 80px) / 3)"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-surface-2" />
            )}

            {/* Gradient overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.5), transparent 55%)' }}
            />

            {/* Label */}
            <span className="absolute left-6 bottom-5 font-display font-extrabold text-xl text-white uppercase z-10">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
