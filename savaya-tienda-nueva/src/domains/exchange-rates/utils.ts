export type ExchangeRate = {
  currency: 'usd' | 'eur'
  rateVes: number
  source: string
  fetchedAt: Date
  isManualOverride: boolean
}

export function convertToVes(amountUsd: number, rate: ExchangeRate): number {
  return amountUsd * rate.rateVes
}

export function formatVes(amountVes: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountVes)
}
