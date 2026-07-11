'use client'

import { useState, useMemo } from 'react'
import type { Product } from '@/lib/types'
import { getDiscountPercentage } from '@/lib/utils'
import ProductGallery from './ProductGallery'
import ProductInfo from './ProductInfo'
import type { SizeGuideData } from './SizeGuide'

interface ProductPageClientProps {
  product: Product
  sizeGuide: SizeGuideData | null
}

export default function ProductPageClient({ product, sizeGuide }: ProductPageClientProps) {
  const [activeColor, setActiveColor] = useState<string | null>(null)

  const discountPct =
    product.sale_price != null
      ? getDiscountPercentage(product.base_price, product.sale_price)
      : null

  const badge: 'new' | 'sale' | null =
    product.is_new ? 'new' : product.sale_price != null ? 'sale' : null

  // Map color name → images array for fast lookup
  const colorImagesMap = useMemo<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {}
    for (const ci of product.color_images ?? []) {
      if (ci.images?.length > 0) map[ci.color] = ci.images
    }
    return map
  }, [product.color_images])

  // Show color-specific images if available, fallback to general product images
  const displayImages =
    activeColor && colorImagesMap[activeColor]
      ? colorImagesMap[activeColor]
      : product.images

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
      <ProductGallery
        images={displayImages}
        productName={product.name}
        badge={badge}
        discountPct={discountPct}
        activeColor={activeColor}
      />
      <ProductInfo
        product={product}
        variants={product.variants ?? []}
        sizeGuide={sizeGuide}
        onColorChange={setActiveColor}
      />
    </div>
  )
}
