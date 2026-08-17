'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/shared/ui'
import type { ProductListItem } from '@/domains/catalog/repository'

const STORAGE_KEY = 'savaya-recently-viewed'

// ---------------------------------------------------------------------------
// RecentlyViewed
// Reads IDs from localStorage, fetches products via route handler, renders grid.
// Not visible on first render (SSR) or when localStorage is empty.
// ---------------------------------------------------------------------------

export function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
  // null = loading/not-ready, [] = ready but empty, [...] = ready with data
  const [products, setProducts] = useState<ProductListItem[] | null>(null)

  useEffect(() => {
    let cancelled = false

    function finish(data: ProductListItem[]) {
      if (!cancelled) setProducts(data)
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        finish([])
        return
      }

      const allIds: string[] = JSON.parse(raw) as string[]
      // Exclude the current product
      const ids = allIds.filter((id) => id !== currentProductId).slice(0, 8)

      if (ids.length === 0) {
        finish([])
        return
      }

      const qs = ids.join(',')
      fetch(`/api/products/recently-viewed?ids=${encodeURIComponent(qs)}`)
        .then((res) => (res.ok ? (res.json() as Promise<ProductListItem[]>) : []))
        .then(finish)
        .catch(() => finish([]))
    } catch {
      finish([])
    }

    return () => {
      cancelled = true
    }
  }, [currentProductId])

  // Don't render anything until client-side check completes or if no products
  if (!products || products.length === 0) return null

  return (
    <section className="mt-20" aria-labelledby="recently-viewed-heading">
      <h2
        id="recently-viewed-heading"
        className="font-display text-2xl font-bold mb-6 text-text-primary"
      >
        Vistos recientemente
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            slug={product.slug}
            name={product.name}
            basePrice={product.basePrice}
            compareAtPrice={product.compareAtPrice}
            images={product.images}
            availableColors={product.availableColors}
          />
        ))}
      </div>
    </section>
  )
}
