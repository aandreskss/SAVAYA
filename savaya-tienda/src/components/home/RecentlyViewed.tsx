'use client'

import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import ProductCard from '@/components/product/ProductCard'
import type { Product } from '@/lib/types'

export default function RecentlyViewed() {
  const recent = useRecentlyViewed()

  // Only show when at least 2 products have been viewed
  if (recent.length < 2) return null

  const products: Product[] = recent.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: null,
    category_id: '',
    gender: 'unisex' as const,
    type: 'clothing' as const,
    base_price: p.price,
    sale_price: p.sale_price,
    is_new: p.is_new,
    is_featured: p.is_featured,
    is_active: true,
    images: p.image ? [p.image] : [],
    tags: [],
    created_at: '',
    divisa_price: p.divisa_price,
  }))

  return (
    <section className="py-10 border-t border-gray-light">
      <div className="px-4 md:px-8">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-xl font-bold">Vistos recientemente</h2>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="md:hidden flex gap-3 overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide snap-x snap-mandatory">
          {products.map((product) => (
            <div key={product.id} className="w-[47vw] min-w-[150px] max-w-[200px] shrink-0 snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
