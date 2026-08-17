import { Suspense } from 'react'
import { listAdminOrders } from '@/domains/admin/orders/repository'
import { OrdersTable } from '@/domains/admin/orders/components/OrdersTable'
import { BlockSkeleton } from '@/app/admin/_components/DashboardSkeletons'
import type { AdminOrderFilters } from '@/domains/admin/orders/types'
import type { OrderStatus } from '@/domains/orders/state-machine'

type PageProps = {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}

export default async function PedidosAdminPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: AdminOrderFilters = {
    status: params.status as OrderStatus | undefined,
    search: params.search,
    page: params.page ? Number(params.page) : 1,
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Pedidos</h1>
        <p className="text-text-secondary text-sm">Gestiona todos los pedidos de la tienda</p>
      </div>

      <Suspense fallback={<BlockSkeleton />}>
        <OrdersContent filters={filters} />
      </Suspense>
    </div>
  )
}

async function OrdersContent({ filters }: { filters: AdminOrderFilters }) {
  const { items, total } = await listAdminOrders(filters)
  return <OrdersTable items={items} total={total} filters={filters} />
}
