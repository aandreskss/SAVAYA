'use client'

import { useState } from 'react'
import { ProductGallery } from './ProductGallery'
import { ProductInfo } from './ProductInfo'
import type { ProductDetail } from '@/domains/catalog/repository'
import type { ExchangeRate } from '@/domains/exchange-rates/service'
import type { ActionResult } from '@/shared/lib/types'

// ---------------------------------------------------------------------------
// ProductClientShell
// Manages client state (selectedVariantId) and wires Gallery ↔ Info together.
// The parent Server Component passes down all data-fetching results.
// ---------------------------------------------------------------------------

export type ProductClientShellProps = {
  product: ProductDetail
  exchangeRate: ExchangeRate
  onAddToCart: (variantId: string, quantity: number) => Promise<ActionResult<unknown>>
  onWishlistToggle: (productId: string) => Promise<void>
  isInWishlist: boolean
}

export function ProductClientShell({
  product,
  exchangeRate,
  onAddToCart,
  onWishlistToggle,
  isInWishlist,
}: ProductClientShellProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined)

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      <ProductGallery
        images={product.images}
        selectedVariantId={selectedVariantId}
        productName={product.name}
      />
      <ProductInfo
        product={product}
        selectedVariantId={selectedVariantId}
        exchangeRate={exchangeRate}
        onVariantChange={setSelectedVariantId}
        onAddToCart={onAddToCart}
        onWishlistToggle={onWishlistToggle}
        isInWishlist={isInWishlist}
      />
    </div>
  )
}
