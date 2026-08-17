import type { OrderStatus } from '@/domains/orders/state-machine'

export type AdminOrderListItem = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  createdAt: Date
  totalUsd: string
  totalBs: string
  paymentMethodName: string | null
  status: OrderStatus
  proofStatus: 'pending' | 'approved' | 'rejected' | null
}

export type AdminOrderFilters = {
  status?: OrderStatus
  search?: string
  page?: number
}

export type AdminPaymentProof = {
  id: string
  orderId: string
  status: 'pending' | 'approved' | 'rejected'
  amountPaid: string
  currency: string
  reference: string
  paymentDate: string
  holderName: string
  cloudinaryPublicId: string | null
  rejectionReason: string | null
  reviewedAt: Date | null
  metadata: Record<string, unknown> | null
  paymentMethodName: string
}

export type AdminOrderStatusEvent = {
  id: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  reason: string | null
  actorEmail: string | null
  createdAt: Date
}

export type AdminOrderDetail = {
  id: string
  orderNumber: string
  status: OrderStatus
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    whatsapp: string | null
  }
  items: Array<{
    id: string
    quantity: number
    unitPriceUsd: string
    totalUsd: string
    productSnapshot: Record<string, unknown>
  }>
  subtotalUsd: string
  discountUsd: string
  shippingCostUsd: string
  totalUsd: string
  totalBs: string
  exchangeRateSnapshot: string
  reservationPaymentType: string | null
  shippingSnapshot: Record<string, unknown> | null
  notes: string | null
  paymentMethodName: string | null
  statusHistory: AdminOrderStatusEvent[]
  proof: AdminPaymentProof | null
  createdAt: Date
  updatedAt: Date
}

export type PendingPaymentItem = {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  totalUsd: string
  totalBs: string
  createdAt: Date
  proof: AdminPaymentProof
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
