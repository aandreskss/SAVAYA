import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import OrdersTable, { type OrderRow } from '@/components/dashboard/pedidos/OrdersTable'

export const metadata: Metadata = { title: 'Pedidos — Admin' }

export default async function PedidosPage() {
  const supabase = await createAdminClient()

  const { data } = await supabase
    .from('orders')
    .select('id, order_number, email, status, total, payment_method, shipping_address, created_at')
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as unknown as OrderRow[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-bold text-black">Pedidos</h1>
          <p className="text-sm text-gray-text font-body mt-0.5">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} en total
          </p>
        </div>
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}
