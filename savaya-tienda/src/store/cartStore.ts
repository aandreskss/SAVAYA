import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, CartState } from '@/lib/types'

export interface CartDiscount {
  code: string
  label: string
  amount: number
}

export interface CartActions {
  addItem: (item: CartItem) => void
  removeItem: (variantId: string) => void
  updateQuantity: (variantId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleMiniCart: () => void
  setDiscount: (d: CartDiscount) => void
  clearDiscount: () => void
}

export type CartStore = CartState & { discount: CartDiscount | null } & CartActions

function addItemReducer(items: CartItem[], newItem: CartItem): CartItem[] {
  const existing = items.find((i) => i.variantId === newItem.variantId)
  if (existing) {
    return items.map((i) =>
      i.variantId === newItem.variantId
        ? { ...i, quantity: i.quantity + newItem.quantity }
        : i,
    )
  }
  return [...items, newItem]
}

function updateQuantityReducer(items: CartItem[], variantId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return items.filter((i) => i.variantId !== variantId)
  return items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      discount: null,

      addItem: (item) =>
        set((state) => ({ items: addItemReducer(state.items, item), isOpen: true })),

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({ items: updateQuantityReducer(state.items, variantId, quantity) })),

      clearCart: () => set({ items: [], discount: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleMiniCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setDiscount: (d) => set({ discount: d }),
      clearDiscount: () => set({ discount: null }),
    }),
    {
      name: 'savaya-cart',
      partialize: (state) => ({ items: state.items, discount: state.discount }),
    },
  ),
)
