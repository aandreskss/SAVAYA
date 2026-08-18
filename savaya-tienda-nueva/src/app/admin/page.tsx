import { auth } from '@/domains/auth/auth'
import {
  getDashboardKPIs,
  getSalesChartData,
  getPendingPayments,
  getLowStockItems,
  getTopProducts,
  getSalesByMethod,
} from '@/domains/admin/dashboard/repository'
import { getPeriodBounds, getPeriodLabel, parsePeriod } from '@/domains/admin/dashboard/period'
import { PeriodSelector } from './_components/PeriodSelector'
import { DashboardKPIs } from './_components/DashboardKPIs'
import { SalesChartBlock } from './_components/SalesChartBlock'
import { PendingPaymentsBlock } from './_components/PendingPaymentsBlock'
import { LowStockBlock } from './_components/LowStockBlock'
import { TopProductsBlock } from './_components/TopProductsBlock'
import { SalesByMethodBlock } from './_components/SalesByMethodBlock'

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

  const [kpis, chartData, pendingPayments, lowStock, topProducts, salesByMethod] =
    await Promise.all([
      getDashboardKPIs(start, end),
      getSalesChartData(start, end),
      getPendingPayments(),
      getLowStockItems(),
      getTopProducts(start, end),
      getSalesByMethod(start, end),
    ])

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

      <DashboardKPIs kpis={kpis} />
      <SalesChartBlock data={chartData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <PendingPaymentsBlock items={pendingPayments} />
          <LowStockBlock items={lowStock} />
        </div>
        <div className="flex flex-col gap-6">
          <TopProductsBlock items={topProducts} />
          <SalesByMethodBlock items={salesByMethod} />
        </div>
      </div>
    </div>
  )
}
