export type PaymentMethodType = 'zelle' | 'pago_movil' | 'bank_transfer' | 'usdt_trc20' | 'binance_pay' | 'cash'
export type PaymentCurrency = 'usd' | 'ves'

export type AccountDetails = Record<string, unknown>

export type AdminPaymentMethod = {
  id: string
  name: string
  type: PaymentMethodType
  currency: PaymentCurrency
  isActive: boolean
  instructions: string | null
  accountDetails: AccountDetails | null
  iconUrl: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }
