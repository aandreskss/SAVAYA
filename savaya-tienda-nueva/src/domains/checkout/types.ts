// ---------------------------------------------------------------------------
// Checkout domain — shared TypeScript types
// ---------------------------------------------------------------------------

export type CheckoutStep = 1 | 2 | 3 | 4

// ── Shipping ─────────────────────────────────────────────────────────────────

export type ShippingZoneType = 'local_delivery' | 'national_agency' | 'pickup'

export type ShippingZoneOption = {
  id: string
  name: string
  type: ShippingZoneType
  isActive: boolean
}

export type ShippingCityOption = {
  id: string
  zoneId: string
  name: string
  state: string
}

export type ShippingMethodOption = {
  id: string
  zoneId: string
  name: string
  provider: string | null
  estimatedDays: number | null
  isActive: boolean
}

export type ShippingRateOption = {
  id: string
  methodId: string
  cityId: string | null
  minOrderUsd: number
  maxOrderUsd: number | null
  rateUsd: number
  freeShippingThresholdUsd: number | null
}

export type ShippingOption = {
  zone: ShippingZoneOption
  cities: ShippingCityOption[]
  methods: ShippingMethodOption[]
  rates: ShippingRateOption[]
}

// ── Payment methods ───────────────────────────────────────────────────────────

export type PaymentMethodType =
  | 'zelle'
  | 'pago_movil'
  | 'bank_transfer'
  | 'usdt_trc20'
  | 'binance_pay'
  | 'cash'

export type PaymentCurrency = 'usd' | 'ves'

export type PaymentMethodOption = {
  id: string
  name: string
  type: PaymentMethodType
  currency: PaymentCurrency
  isActive: boolean
  instructions: string | null
  accountDetails: Record<string, string> | null
  iconUrl: string | null
  sortOrder: number
}

// ── Checkout form state ───────────────────────────────────────────────────────

export type PersonalData = {
  firstName: string
  lastName: string
  email: string
  whatsapp: string
}

export type ShippingData = {
  zoneId: string
  zoneType: ShippingZoneType
  methodId: string
  cityId?: string
  recipientName: string
  state?: string
  city?: string
  municipality?: string
  parish?: string
  address?: string
  reference?: string
}

export type PartialPaymentType = 'full' | 'partial_20' | 'partial_35' | 'partial_50'

export type PaymentData = {
  methodId: string
  methodType: PaymentMethodType
  methodCurrency: PaymentCurrency
  partialPaymentType: PartialPaymentType
  // Declaration fields (what customer paid)
  reference: string
  amountPaid: string  // kept as string for form binding; converted to number on submit
  paymentDate: string // 'YYYY-MM-DD'
  holderName: string
  // Method-specific fields
  bankName?: string
  bankPhone?: string
  clientId?: string      // cédula del cliente (pago_movil)
  transactionHash?: string  // USDT
  // Proof upload result
  cloudinaryPublicId?: string
  cloudinaryUrl?: string
  proofFileName?: string
}

export type OrderResult = {
  orderId: string
  orderNumber: string
  totalUsd: number
  totalBs: number
  status: string
}

// ── Initial page data (SSR) ───────────────────────────────────────────────────

export type CheckoutInitialData = {
  paymentMethods: PaymentMethodOption[]
  shippingOptions: ShippingOption[]
  exchangeRate: number
  partialPaymentOptions: number[]   // [20, 35, 50] — percentages
  reservationExpiryHours: number
  cartSubtotalUsd: number
  cartItemCount: number
}

// ── Coupon ───────────────────────────────────────────────────────────────────

export type AppliedCoupon = {
  code: string
  discountId: string
  discountAmount: number
}

// ── createOrder input (cartId added server-side from HttpOnly cookie) ─────────

export type CreateOrderInput = {
  personalData: PersonalData
  shippingData: ShippingData
  paymentData: PaymentData
  shippingCostUsd: number
  exchangeRate: number
  idempotencyKey: string
  couponCode?: string
}
