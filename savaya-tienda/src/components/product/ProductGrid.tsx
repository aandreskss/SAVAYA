import type { Product } from '@/lib/types'
import ProductCard from './ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  skeletonCount?: number
}

export default function ProductGrid({ products, loading = false, skeletonCount = 8 }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <div className="py-20 text-center text-gray-text">
        <p className="font-heading">No se encontraron productos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index === 0} />
      ))}
    </div>
  )
}
