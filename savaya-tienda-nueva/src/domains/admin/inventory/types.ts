export type InventoryRow = {
  variantId: string
  productId: string
  productName: string
  productSlug: string
  sku: string
  colorName: string
  colorHex: string
  sizeName: string
  quantity: number
  reserved: number
  available: number
  isLow: boolean
}

export type MovementHistoryRow = {
  id: string
  type: string
  quantity: number
  reason: string | null
  performedByEmail: string | null
  createdAt: Date
}

export type ManualMovementPayload = {
  variantId: string
  type: 'purchase' | 'adjustment' | 'correction'
  delta: number
  reason: string
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export const LOW_STOCK_THRESHOLD = 5
