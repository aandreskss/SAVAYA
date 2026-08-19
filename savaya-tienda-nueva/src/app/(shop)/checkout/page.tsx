import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCheckoutInitialData } from '@/domains/checkout/repository'
import { getCartSummary } from '@/domains/cart/repository'
import { getCartId } from '@/domains/cart/service'
import { getDisplayRate } from '@/domains/exchange-rates/service'
import { CheckoutClient } from '@/domains/checkout/components/CheckoutClient'

export const metadata: Metadata = {
  title: 'Checkout | SAVAYA',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  const cartId = await getCartId()
  const [cart, rateData] = await Promise.all([
    getCartSummary(cartId),
    getDisplayRate(),
  ])

  // Guard: empty or unavailable-only cart
  const availableItems = cart.items.filter((i) => i.isAvailable)
  if (availableItems.length === 0) {
    redirect('/carrito')
  }

  const initialData = await getCheckoutInitialData(
    cart.subtotalUsd,
    cart.itemCount,
    rateData.rateVes,
  )

  return (
    <main>
      <CheckoutClient initialData={initialData} />
    </main>
  )
}
