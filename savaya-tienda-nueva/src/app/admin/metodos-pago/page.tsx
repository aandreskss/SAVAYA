import { Suspense } from 'react'
import { auth } from '@/domains/auth/auth'
import { listPaymentMethods } from '@/domains/admin/payment-methods/repository'
import { PaymentMethodsManager } from '@/domains/admin/payment-methods/components/PaymentMethodsManager'

async function MetodosPagoContent() {
  const [methods, session] = await Promise.all([listPaymentMethods(), auth()])
  const permissions = (session?.user?.permissions ?? []) as string[]
  const canEdit = permissions.includes('settings:write')
  return <PaymentMethodsManager initialMethods={methods} canEdit={canEdit} />
}

export default function MetodosPagoAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-text-secondary text-sm">
            Cargando métodos de pago…
          </div>
        }
      >
        <MetodosPagoContent />
      </Suspense>
    </div>
  )
}
