import { Suspense } from 'react'
import { auth } from '@/domains/auth/auth'
import { listRateHistory } from '@/domains/admin/exchange-rates/repository'
import { ExchangeRatesManager } from '@/domains/admin/exchange-rates/components/ExchangeRatesManager'

async function TasasContent() {
  const [history, session] = await Promise.all([listRateHistory(30), auth()])
  const permissions = (session?.user?.permissions ?? []) as string[]
  const canOverride = permissions.includes('exchange_rates:override')
  return <ExchangeRatesManager history={history} canOverride={canOverride} />
}

export default function TasasAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-text-secondary text-sm">
            Cargando tasas…
          </div>
        }
      >
        <TasasContent />
      </Suspense>
    </div>
  )
}
