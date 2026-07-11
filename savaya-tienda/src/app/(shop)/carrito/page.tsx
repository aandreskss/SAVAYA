import type { Metadata } from 'next'
import { parseSearchParams, fetchCatalogProducts } from '@/lib/catalog'
import CartPageClient from '@/components/cart/CartPageClient'

export const metadata: Metadata = {
  title: 'Mi carrito | Savaya',
}

export default async function CarritoPage() {
  // Pre-fetch a pool of products for the "También te puede gustar" section.
  // CartPageClient filters out items already in the cart on the client side.
  const { products: suggestions } = await fetchCatalogProducts(
    { fixedIsNew: true },
    parseSearchParams({}),
  )

  return <CartPageClient suggestions={suggestions.slice(0, 8)} />
}
