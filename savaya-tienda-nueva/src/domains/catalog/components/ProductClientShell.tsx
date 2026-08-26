'use client'

import { useState } from 'react'
import { ProductGallery } from './ProductGallery'
import { ProductInfo } from './ProductInfo'
import { toggleWishlist } from '@/domains/customers/wishlist-actions'
import type { ProductDetail } from '@/domains/catalog/repository'
import type { ExchangeRate } from '@/domains/exchange-rates/utils'
import type { ActionResult } from '@/shared/lib/types'

// ---------------------------------------------------------------------------
// ProductClientShell
// Manages client state (selectedVariantId, wishlistSet) and wires Gallery ↔ Info.
// ---------------------------------------------------------------------------

export type ProductClientShellProps = {
  product: ProductDetail
  exchangeRate: ExchangeRate
  onAddToCart: (variantId: string, quantity: number) => Promise<ActionResult<unknown>>
  wishlistVariantIds: string[]
}

export function ProductClientShell({
  product,
  exchangeRate,
  onAddToCart,
  wishlistVariantIds,
}: ProductClientShellProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined)
  const [wishlistSet, setWishlistSet] = useState(() => new Set(wishlistVariantIds))

  const activeVariantId = selectedVariantId ?? product.variants[0]?.id
  const isInWishlist = !!activeVariantId && wishlistSet.has(activeVariantId)

  async function handleWishlistToggle(variantId: string) {
    // Optimistic toggle
    setWishlistSet((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return next
    })

    const result = await toggleWishlist(variantId)

    if (result.success && result.data !== undefined) {
      // Sync with server truth
      setWishlistSet((prev) => {
        const next = new Set(prev)
        if (result.data!.isInWishlist) next.add(variantId)
        else next.delete(variantId)
        return next
      })
    } else if (!result.success) {
      // Revert on error
      setWishlistSet((prev) => {
        const next = new Set(prev)
        if (next.has(variantId)) next.delete(variantId)
        else next.add(variantId)
        return next
      })
    }
  }

  const selectedColorId = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)?.color.id
    : product.variants[0]?.color.id

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      <ProductGallery
        images={product.images}
        selectedVariantId={selectedVariantId}
        selectedColorId={selectedColorId}
        productName={product.name}
      />
      <ProductInfo
        product={product}
        selectedVariantId={selectedVariantId}
        exchangeRate={exchangeRate}
        onVariantChange={setSelectedVariantId}
        onAddToCart={onAddToCart}
        onWishlistToggle={handleWishlistToggle}
        isInWishlist={isInWishlist}
      />
    </div>
  )
}
