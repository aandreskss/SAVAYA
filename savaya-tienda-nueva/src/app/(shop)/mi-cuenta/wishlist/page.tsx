import type { Metadata } from 'next'
import { auth } from '@/domains/auth/auth'
import { getCustomerByEmail, getWishlistProducts } from '@/domains/customers/repository'
import { WishlistView } from '@/domains/customers/components/WishlistView'

export const metadata: Metadata = {
  title: 'Mi wishlist | SAVAYA',
  robots: { index: false, follow: false },
}

export default async function WishlistPage() {
  const session = await auth()
  if (!session?.user?.email) return null

  const customer = process.env.DATABASE_URL
    ? await getCustomerByEmail(session.user.email)
    : null

  const products = customer && process.env.DATABASE_URL
    ? await getWishlistProducts(customer.id)
    : []

  return <WishlistView products={products} />
}
