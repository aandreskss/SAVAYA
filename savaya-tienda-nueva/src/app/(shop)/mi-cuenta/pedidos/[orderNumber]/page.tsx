import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { auth } from '@/domains/auth/auth'
import { getCustomerByEmail } from '@/domains/customers/repository'
import { getOrderByNumberForCustomer } from '@/domains/orders/repository'
import { PedidoDetailView } from '@/domains/customers/components/PedidoDetailView'

export const metadata: Metadata = {
  title: 'Detalle de pedido | SAVAYA',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ orderNumber: string }>
}

export default async function PedidoDetailPage({ params }: Props) {
  const { orderNumber } = await params
  const session = await auth()
  if (!session?.user?.email) return null

  const customer = process.env.DATABASE_URL
    ? await getCustomerByEmail(session.user.email)
    : null

  if (!customer) {
    // No customer record → can't have orders
    notFound()
  }

  const order = process.env.DATABASE_URL
    ? await getOrderByNumberForCustomer(orderNumber, customer.id)
    : null

  if (!order) {
    // Not found OR belongs to another customer — both return 404
    notFound()
  }

  return <PedidoDetailView order={order} />
}
