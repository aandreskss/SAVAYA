import { Suspense } from 'react'
import { listAdminCustomers } from '@/domains/admin/customers/repository'
import { CustomersTable } from '@/domains/admin/customers/components/CustomersTable'
import { BlockSkeleton } from '@/app/admin/_components/DashboardSkeletons'
import type { AdminCustomerFilters, CustomerTag } from '@/domains/admin/customers/types'

type PageProps = {
  searchParams: Promise<{ search?: string; tag?: string; page?: string }>
}

export default async function ClientesAdminPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: AdminCustomerFilters = {
    search: params.search,
    tag: params.tag as CustomerTag | undefined,
    page: params.page ? Number(params.page) : 1,
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Clientes</h1>
        <p className="text-text-secondary text-sm">Base de clientes y segmentación</p>
      </div>

      <Suspense fallback={<BlockSkeleton />}>
        <ClientesContent filters={filters} />
      </Suspense>
    </div>
  )
}

async function ClientesContent({ filters }: { filters: AdminCustomerFilters }) {
  const { items, total } = await listAdminCustomers(filters)
  return <CustomersTable items={items} total={total} filters={filters} />
}
