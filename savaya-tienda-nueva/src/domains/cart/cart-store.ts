import { create } from 'zustand'
import type { CartSummary } from './repository'

// ---------------------------------------------------------------------------
// CartStore — UI state only (open/closed + latest summary)
// Prices, stock and totals always come from server. This store just holds the
// last received CartSummary and the drawer visibility state.
// ---------------------------------------------------------------------------

type CartStore = {
  isOpen: boolean
  summary: CartSummary | null
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  setSummary: (summary: CartSummary) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  isOpen: false,
  summary: null,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  setSummary: (summary) => set({ summary }),
  clearCart: () => set({ summary: null, isOpen: false }),
}))
