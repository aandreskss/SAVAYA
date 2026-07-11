import type { CartItem } from './types'

export function getEffectivePrice(item: CartItem, totalQty: number, minQty: number): number {
  if (item.wholesalePrice != null && totalQty >= minQty) return item.wholesalePrice
  return item.price
}

export function computeWholesaleSubtotal(items: CartItem[], minQty: number): number {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  return items.reduce((s, i) => s + getEffectivePrice(i, totalQty, minQty) * i.quantity, 0)
}

export function isWholesaleActive(items: CartItem[], minQty: number): boolean {
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  return totalQty >= minQty && items.some((i) => i.wholesalePrice != null)
}
