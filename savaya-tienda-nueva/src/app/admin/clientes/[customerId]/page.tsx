import { notFound } from 'next/navigation'
import { getAdminCustomerById } from '@/domains/admin/customers/repository'
import { CustomerDetailView } from '@/domains/admin/customers/components/CustomerDetailView'

type PageProps = {
  params: Promise<{ customerId: string }>
}

export default async function ClienteDetailPage({ params }: PageProps) {
  const { customerId } = await params
  const customer = await getAdminCustomerById(customerId)

  if (!customer) notFound()

  return (
    <div className="p-6 md:p-8">
      <CustomerDetailView customer={customer} />
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { customerId } = await params
  const customer = await getAdminCustomerById(customerId)
  if (!customer) return { title: 'Cliente no encontrado' }
  return { title: `${customer.firstName} ${customer.lastName}` }
}
