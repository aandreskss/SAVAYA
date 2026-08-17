import { Suspense } from 'react'
import { auth } from '@/domains/auth/auth'
import { getPeriodBounds, getPeriodLabel, parsePeriod } from '@/domains/admin/dashboard/period'
import { PeriodSelector } from './_components/PeriodSelector'
import { DashboardKPIs } from './_components/DashboardKPIs'
import { SalesChartBlock } from './_components/SalesChartBlock'
import { PendingPaymentsBlock } from './_components/PendingPaymentsBlock'
import { LowStockBlock } from './_components/LowStockBlock'
import { TopProductsBlock } from './_components/TopProductsBlock'
import { SalesByMethodBlock } from './_components/SalesByMethodBlock'
import { KPIsSkeleton, ChartSkeleton, BlockSkeleton } from './_components/DashboardSkeletons'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; forbidden?: string }>
}) {
  const [session, params] = await Promise.all([auth(), searchParams])
  const name = session?.user?.name ?? session?.user?.email ?? 'Administrador'

  const period = parsePeriod(params.period)
  const { start, end } = getPeriodBounds(period)
  const periodLabel = getPeriodLabel(period)
  const forbidden = params.forbidden === '1'

  return (
    <div className="p-6 md:p-8">
      {forbidden && (
        <div className="mb-6 bg-error/10 border border-error/20 text-error rounded-xl px-4 py-3 text-sm">
          No tienes permiso para acceder a esa sección.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Inicio</h1>
          <p className="text-text-secondary text-sm">
            Bienvenido, {name} · {periodLabel}
          </p>
        </div>
        <PeriodSelector current={period} />
      </div>

      {/* KPI cards */}
      <Suspense fallback={<KPIsSkeleton />}>
        <DashboardKPIs start={start} end={end} />
      </Suspense>

      {/* Sales chart */}
      <Suspense fallback={<ChartSkeleton />}>
        <SalesChartBlock start={start} end={end} />
      </Suspense>

      {/* Bottom grid: pending payments + low stock | top products + sales by method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <Suspense fallback={<BlockSkeleton title="Pagos pendientes de revisión" />}>
            <PendingPaymentsBlock />
          </Suspense>
          <Suspense fallback={<BlockSkeleton title="Stock bajo" />}>
            <LowStockBlock />
          </Suspense>
        </div>
        <div className="flex flex-col gap-6">
          <Suspense fallback={<BlockSkeleton title="Productos más vendidos" />}>
            <TopProductsBlock start={start} end={end} />
          </Suspense>
          <Suspense fallback={<BlockSkeleton title="Ventas por método de pago" />}>
            <SalesByMethodBlock start={start} end={end} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
