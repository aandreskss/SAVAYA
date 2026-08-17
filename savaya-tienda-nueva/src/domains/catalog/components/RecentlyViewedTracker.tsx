'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'savaya-recently-viewed'
const MAX_IDS = 8

// ---------------------------------------------------------------------------
// RecentlyViewedTracker
// Componente sin UI — rastrea la vista del producto en localStorage.
// ---------------------------------------------------------------------------

export function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId) return

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const existing: string[] = raw ? (JSON.parse(raw) as string[]) : []

      // Remove duplicate if present, then prepend current product
      const updated = [productId, ...existing.filter((id) => id !== productId)].slice(0, MAX_IDS)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // localStorage not available (e.g. private mode or SSR) — silently ignore
    }
  }, [productId])

  return null
}
