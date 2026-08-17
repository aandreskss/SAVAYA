export type DashboardKPIs = {
  revenue: number
  orderCount: number
  avgTicket: number
  uniqueCustomers: number
  newCustomers: number
}

export type SalesChartPoint = {
  day: string      // YYYY-MM-DD
  revenue: number
  orderCount: number
}

export type PendingPaymentItem = {
  orderId: string
  orderNumber: string
  totalUsd: number
  customerName: string
  paymentMethodName: string
  proofId: string
  submittedAt: string
}

export type LowStockItem = {
  variantId: string
  productName: string
  sku: string
  colorName: string
  sizeName: string
  available: number
}

export type TopProductItem = {
  name: string
  slug: string | null
  revenue: number
  unitsSold: number
}

export type SalesByMethodItem = {
  methodName: string
  methodType: string
  orderCount: number
  revenue: number
}
