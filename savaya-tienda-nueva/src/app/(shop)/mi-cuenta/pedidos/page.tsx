import type { Metadata } from 'next'
import { auth } from '@/domains/auth/auth'
import { getCustomerByEmail } from '@/domains/customers/repository'
import { getOrdersByCustomerId } from '@/domains/orders/repository'
import { PedidosView } from '@/domains/customers/components/PedidosView'

export const metadata: Metadata = {
  title: 'Mis pedidos | SAVAYA',
  robots: { index: false, follow: false },
}

export default async function PedidosPage() {
  const session = await auth()
  if (!session?.user?.email) return null

  const customer = process.env.DATABASE_URL
    ? await getCustomerByEmail(session.user.email)
    : null

  const orders = customer && process.env.DATABASE_URL
    ? await getOrdersByCustomerId(customer.id)
    : []

  return <PedidosView orders={orders} />
}
