import Link from 'next/link'
import ProductCard from '@/components/product/ProductCard'
import type { Product } from '@/lib/types'

function ProductScrollGrid({ products }: { products: Product[] }) {
  return (
    <>
      <div className="md:hidden flex gap-3 overflow-x-auto -mx-4 px-4 pb-4 scrollbar-hide snap-x snap-mandatory">
        {products.map((product) => (
          <div key={product.id} className="w-[47vw] min-w-[160px] max-w-[220px] shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}

export default function FeaturedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null

  return (
    <section className="py-14">
      <div className="px-4 md:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">Los más vendidos</h2>
          <Link
            href="/mas-vendidos"
            className="text-sm font-medium text-gray-text hover:text-black underline underline-offset-2 transition-colors hidden sm:block"
          >
            Ver todos los más vendidos →
          </Link>
        </div>
        <ProductScrollGrid products={products} />
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/mas-vendidos"
            className="inline-block px-8 py-3 border border-black text-sm font-heading font-bold tracking-wide rounded hover:bg-black hover:text-white transition-colors"
          >
            Ver todos los más vendidos
          </Link>
        </div>
      </div>
    </section>
  )
}
