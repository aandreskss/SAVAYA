import type { OrderStatus } from '@/domains/orders/state-machine'

// ---------------------------------------------------------------------------
// Customer-facing types — used across /mi-cuenta sections
// ---------------------------------------------------------------------------

export type CustomerProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  whatsapp: string | null
  totalOrders: number
  totalSpentUsd: string
  createdAt: Date
}

export type CustomerAddress = {
  id: string
  customerId: string
  label: string
  recipientName: string
  state: string
  city: string
  municipality: string
  parish: string | null
  address: string
  reference: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export type WishlistProduct = {
  variantId: string
  productSlug: string
  productName: string
  colorName: string
  sizeName: string
  priceUsd: string
  compareAtPriceUsd: string | null
  imageUrl: string | null
  isAvailable: boolean
  addedAt: Date
}

export type OrderListItem = {
  id: string
  orderNumber: string
  status: OrderStatus
  totalUsd: string
  totalBs: string
  itemCount: number
  createdAt: Date
  firstItemSnapshot: { name: string; imageUrl?: string } | null
}

export type OrderStatusEvent = {
  id: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  reason: string | null
  createdAt: Date
}

export type OrderDetailItem = {
  id: string
  quantity: number
  unitPriceUsd: string
  totalUsd: string
  productSnapshot: Record<string, unknown>
}

export type OrderDetail = {
  id: string
  orderNumber: string
  status: OrderStatus
  subtotalUsd: string
  discountUsd: string
  shippingCostUsd: string
  totalUsd: string
  exchangeRateSnapshot: string
  totalBs: string
  reservationPaymentType: string | null
  shippingSnapshot: Record<string, unknown> | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  items: OrderDetailItem[]
  statusHistory: OrderStatusEvent[]
  paymentMethodName: string | null
}
