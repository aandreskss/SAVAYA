import type { Metadata } from 'next'
import { getCart } from '@/domains/cart/actions'
import { CartPageClient } from '@/domains/cart/components/CartPageClient'
import { getDisplayRate } from '@/domains/exchange-rates/service'
import { convertToVes } from '@/domains/exchange-rates/utils'

export const metadata: Metadata = {
  title: 'Tu carrito — SAVAYA',
}

export default async function CartPage() {
  const [summary, rate] = await Promise.all([getCart(), getDisplayRate()])

  const subtotalVes = convertToVes(summary.subtotalUsd, rate)

  return (
    <CartPageClient
      initialSummary={summary}
      subtotalVes={subtotalVes}
      rateCurrency={rate.currency}
    />
  )
}
