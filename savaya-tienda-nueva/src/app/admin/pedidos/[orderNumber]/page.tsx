import { notFound } from 'next/navigation'
import { getAdminOrderByNumber } from '@/domains/admin/orders/repository'
import { OrderDetailView } from '@/domains/admin/orders/components/OrderDetailView'

type PageProps = {
  params: Promise<{ orderNumber: string }>
}

export default async function PedidoDetailPage({ params }: PageProps) {
  const { orderNumber } = await params
  const order = await getAdminOrderByNumber(orderNumber)

  if (!order) notFound()

  return (
    <div className="p-6 md:p-8">
      <OrderDetailView order={order} />
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { orderNumber } = await params
  return { title: `Pedido ${orderNumber}` }
}
