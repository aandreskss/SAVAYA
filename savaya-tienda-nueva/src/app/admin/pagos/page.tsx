import { Suspense } from 'react'
import { getPendingPayments } from '@/domains/admin/orders/repository'
import { PaymentVerificationPanel } from '@/domains/admin/orders/components/PaymentVerificationPanel'
import { BlockSkeleton } from '@/app/admin/_components/DashboardSkeletons'

export default function PagosAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Verificación de pagos</h1>
        <p className="text-text-secondary text-sm">Revisa y aprueba los comprobantes enviados por los clientes</p>
      </div>

      <Suspense fallback={<BlockSkeleton />}>
        <PagosContent />
      </Suspense>
    </div>
  )
}

async function PagosContent() {
  const items = await getPendingPayments()
  return <PaymentVerificationPanel items={items} />
}
