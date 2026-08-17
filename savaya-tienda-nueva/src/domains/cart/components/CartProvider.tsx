'use client'

import { useEffect } from 'react'
import { getCart } from '../actions'
import { useCartStore } from '../cart-store'

// ---------------------------------------------------------------------------
// CartProvider — mounts in the shop layout
// On mount: fetches the current cart (server action) and hydrates the store.
// Subsequent updates happen automatically when cart actions run.
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: React.ReactNode }) {
  const setSummary = useCartStore((s) => s.setSummary)

  useEffect(() => {
    let cancelled = false

    getCart().then((summary) => {
      if (!cancelled) setSummary(summary)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
