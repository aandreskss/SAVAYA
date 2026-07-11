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

export default function SaleProducts({ products }: { products: Product[] }) {
  if (!products.length) return null

  return (
    <section className="py-14">
      <div className="px-4 md:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="inline-block px-3 py-1 bg-sale text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">
              Esta semana
            </span>
            <h2 className="font-display text-2xl font-bold">Ofertas de la semana</h2>
          </div>
          <Link
            href="/descuentos"
            className="text-sm font-medium text-gray-text hover:text-black underline underline-offset-2 transition-colors hidden sm:block"
          >
            Ver todas las ofertas →
          </Link>
        </div>
        <ProductScrollGrid products={products} />
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/descuentos"
            className="inline-block px-8 py-3 bg-sale text-white text-sm font-heading font-bold tracking-wide rounded hover:opacity-90 transition-opacity"
          >
            Ver todas las ofertas
          </Link>
        </div>
      </div>
    </section>
  )
}
