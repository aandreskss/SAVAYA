export type AdminExchangeRate = {
  id: string
  currency: 'usd' | 'eur'
  rateVes: number
  source: string
  isManualOverride: boolean
  overrideReason: string | null
  overrideByName: string | null
  fetchedAt: Date
  createdAt: Date
}

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }
