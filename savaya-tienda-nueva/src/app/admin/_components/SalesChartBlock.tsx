import type { SalesChartPoint } from '@/domains/admin/dashboard/types'
import { SalesLineChart } from './SalesLineChart'

function formatUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function SalesChartBlock({ data }: { data: SalesChartPoint[] }) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalOrders = data.reduce((sum, d) => sum + d.orderCount, 0)
  const avgPerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-border/50">
        <div>
          <p className="font-sans text-xs font-medium text-text-muted uppercase tracking-[0.12em] mb-1">
            Ventas en el tiempo
          </p>
          <p className="font-display text-2xl font-bold text-text-primary">
            {formatUsd(totalRevenue)}
          </p>
        </div>
        <div className="flex gap-6">
          <Metric label="Pedidos" value={String(totalOrders)} />
          <Metric label="Ticket promedio" value={formatUsd(avgPerOrder)} />
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 py-4">
        <SalesLineChart data={data} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="font-sans text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="font-sans text-base font-semibold text-text-primary">
        {value}
      </p>
    </div>
  )
}
