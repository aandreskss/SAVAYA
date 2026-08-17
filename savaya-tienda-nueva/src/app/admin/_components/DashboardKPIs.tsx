import { getDashboardKPIs } from '@/domains/admin/dashboard/repository'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

interface KPICardProps {
  label: string
  value: string
  sub?: string
}

function KPICard({ label, value, sub }: KPICardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className="font-display text-2xl text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
  )
}

export async function DashboardKPIs({ start, end }: { start: Date; end: Date }) {
  const kpis = await getDashboardKPIs(start, end)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <KPICard label="Ventas" value={fmt(kpis.revenue)} />
      <KPICard label="Pedidos" value={String(kpis.orderCount)} />
      <KPICard
        label="Ticket promedio"
        value={fmt(kpis.avgTicket)}
        sub={kpis.orderCount > 0 ? `de ${kpis.orderCount} pedidos` : undefined}
      />
      <KPICard label="Clientes" value={String(kpis.uniqueCustomers)} sub="realizaron pedidos" />
      <KPICard label="Nuevos clientes" value={String(kpis.newCustomers)} sub="primera compra" />
    </div>
  )
}
