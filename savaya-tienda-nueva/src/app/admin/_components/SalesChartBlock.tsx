import type { SalesChartPoint } from '@/domains/admin/dashboard/types'
import { SalesLineChart } from './SalesLineChart'

export function SalesChartBlock({ data }: { data: SalesChartPoint[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-6">
      <h2 className="text-sm font-medium mb-4">Ventas en el tiempo</h2>
      <SalesLineChart data={data} />
    </div>
  )
}
