export type OrderNotificationData = {
  orderNumber: string
  customerName: string
  customerEmail: string
  totalUsd: number
  totalBs: number
  items: Array<{
    name: string
    sku: string
    qty: number
    unitPriceUsd: number
  }>
}

export type WhatsAppLinkOptions = {
  orderNumber: string
  customerName: string
  totalUsd: number
  paymentMethod: string
}
