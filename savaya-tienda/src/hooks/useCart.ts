'use client'

import { useCartStore } from '@/store/cartStore'

export function useCart() {
  const items = useCartStore((s) => s.items)
  const isOpen = useCartStore((s) => s.isOpen)
  const discount = useCartStore((s) => s.discount)
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)
  const openCart = useCartStore((s) => s.openCart)
  const closeCart = useCartStore((s) => s.closeCart)
  const toggleMiniCart = useCartStore((s) => s.toggleMiniCart)
  const setDiscount = useCartStore((s) => s.setDiscount)
  const clearDiscount = useCartStore((s) => s.clearDiscount)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return {
    items,
    isOpen,
    discount,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleMiniCart,
    setDiscount,
    clearDiscount,
  }
}
