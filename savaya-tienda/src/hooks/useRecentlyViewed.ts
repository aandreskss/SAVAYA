'use client'

import { useEffect, useState } from 'react'

export interface RecentlyViewedProduct {
  id: string
  name: string
  slug: string
  image: string
  price: number
  sale_price: number | null
  is_new: boolean
  is_featured: boolean
  divisa_price?: number | null
}

const KEY = 'savaya-recently-viewed'
const MAX = 8

export function useRecentlyViewed() {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setProducts(JSON.parse(stored))
    } catch {
      // ignore parse errors
    }
  }, [])

  return products
}

export function trackProductView(product: RecentlyViewedProduct) {
  try {
    const stored = localStorage.getItem(KEY)
    const existing: RecentlyViewedProduct[] = stored ? JSON.parse(stored) : []
    const filtered = existing.filter((p) => p.id !== product.id)
    const updated = [product, ...filtered].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {
    // ignore storage errors
  }
}
