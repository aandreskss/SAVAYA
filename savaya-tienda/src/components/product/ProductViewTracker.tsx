'use client'

import { useEffect } from 'react'
import { trackProductView } from '@/hooks/useRecentlyViewed'
import type { Product } from '@/lib/types'

export default function ProductViewTracker({ product }: { product: Product }) {
  useEffect(() => {
    trackProductView({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? '',
      price: product.base_price,
      sale_price: product.sale_price,
      is_new: product.is_new,
      is_featured: product.is_featured,
      divisa_price: product.divisa_price,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  return null
}
