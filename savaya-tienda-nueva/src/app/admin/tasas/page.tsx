import { Suspense } from 'react'
import { auth } from '@/domains/auth/auth'
import { listRateHistory, getActiveDisplayRate } from '@/domains/admin/exchange-rates/repository'
import { ExchangeRatesManager } from '@/domains/admin/exchange-rates/components/ExchangeRatesManager'

async function TasasContent() {
  const [history, activeDisplayRate, session] = await Promise.all([
    listRateHistory(50),
    getActiveDisplayRate(),
    auth(),
  ])
  const permissions = (session?.user?.permissions ?? []) as string[]
  const canOverride = permissions.includes('exchange_rates:override')
  const canRefresh = !!session?.user?.id
  return (
    <ExchangeRatesManager
      history={history}
      canOverride={canOverride}
      canRefresh={canRefresh}
      activeDisplayRate={activeDisplayRate}
    />
  )
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
