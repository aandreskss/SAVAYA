'use client'

import { useState, useEffect } from 'react'
import { ProductGallery } from './ProductGallery'
import { ProductInfo } from './ProductInfo'
import { toggleWishlist } from '@/domains/customers/wishlist-actions'
import { trackViewItem, trackAddToWishlist } from '@/domains/analytics/service'
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
  const [selectedColorId, setSelectedColorId] = useState<string | undefined>(
    product.variants[0]?.color.id,
  )
  const [wishlistSet, setWishlistSet] = useState(() => new Set(wishlistVariantIds))

  useEffect(() => {
    trackViewItem({
      item_id: product.id,
      item_name: product.name,
      price: product.basePrice,
      quantity: 1,
      item_category: product.category?.name,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

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
      if (result.data.isInWishlist) {
        trackAddToWishlist({
          item_id: product.id,
          item_name: product.name,
          price: product.basePrice,
          quantity: 1,
        })
      }
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
        onVariantChange={(variantId) => {
          setSelectedVariantId(variantId)
          const color = product.variants.find((v) => v.id === variantId)?.color.id
          if (color) setSelectedColorId(color)
        }}
        onColorChange={setSelectedColorId}
        onAddToCart={onAddToCart}
        onWishlistToggle={handleWishlistToggle}
        isInWishlist={isInWishlist}
      />
    </div>
  )
}
