import { getSalesChartData } from '@/domains/admin/dashboard/repository'
import { SalesLineChart } from './SalesLineChart'

export async function SalesChartBlock({ start, end }: { start: Date; end: Date }) {
  const data = await getSalesChartData(start, end)

  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-6">
      <h2 className="text-sm font-medium mb-4">Ventas en el tiempo</h2>
      <SalesLineChart data={data} />
    </div>
  )
}
