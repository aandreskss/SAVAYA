import type { Metadata } from 'next'
import { auth } from '@/domains/auth/auth'
import { getCustomerByEmail, getCustomerAddresses } from '@/domains/customers/repository'
import { DireccionesView } from '@/domains/customers/components/DireccionesView'

export const metadata: Metadata = {
  title: 'Mis direcciones | SAVAYA',
  robots: { index: false, follow: false },
}

export default async function DireccionesPage() {
  const session = await auth()
  if (!session?.user?.email) return null

  const customer = process.env.DATABASE_URL
    ? await getCustomerByEmail(session.user.email)
    : null

  const addressList = customer && process.env.DATABASE_URL
    ? await getCustomerAddresses(customer.id)
    : []

  return <DireccionesView addresses={addressList} />
}
