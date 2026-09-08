import Link from 'next/link'
import { getProducts } from '@/domains/catalog/repository'
import { ProductCard } from '@/shared/ui/ProductCard'

export async function VipProductsSection() {
  const { items } = await getProducts({ onlyVip: true, limit: 6, sortBy: 'featured' })

  if (items.length === 0) return null

  return (
    <section className="max-w-screen-xl mx-auto px-4 md:px-10 py-12 md:py-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.18em] uppercase px-3 py-1 rounded-full border"
              style={{
                color: '#CA8C31',
                borderColor: 'rgba(202,140,49,0.4)',
                background: 'rgba(202,140,49,0.08)',
              }}
            >
              ★ Exclusivo
            </span>
          </div>
          <h2 className="font-display text-[28px] md:text-[34px] uppercase tracking-tight text-text-primary">
            SAVAYA VIP
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Piezas seleccionadas de nuestra colección premium
          </p>
        </div>
        <Link
          href="/catalogo?vip=1"
          className="font-sans text-sm font-semibold text-text-secondary hover:text-text-primary underline-offset-2 hover:underline transition-colors shrink-0"
        >
          Ver todas →
        </Link>
      </div>

      {/* Gold accent line */}
      <div
        className="w-16 h-0.5 mb-8"
        style={{ background: 'linear-gradient(90deg, #CA8C31 0%, rgba(202,140,49,0.2) 100%)' }}
      />

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
        {items.map((product, index) => (
          <ProductCard
            key={product.id}
            id={product.id}
            slug={product.slug}
            name={product.name}
            basePrice={product.basePrice}
            compareAtPrice={product.compareAtPrice}
            images={product.images}
            availableColors={product.availableColors}
            isVip
            priority={index < 2}
          />
        ))}
      </div>
    </section>
  )
}
