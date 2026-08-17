import { getSalesByMethod } from '@/domains/admin/dashboard/repository'

const METHOD_LABELS: Record<string, string> = {
  zelle: 'Zelle',
  pago_movil: 'Pago Móvil',
  bank_transfer: 'Transf. bancaria',
  usdt_trc20: 'USDT TRC-20',
  binance_pay: 'Binance Pay',
  cash: 'Efectivo',
}

export async function SalesByMethodBlock({ start, end }: { start: Date; end: Date }) {
  const items = await getSalesByMethod(start, end)

  const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0)

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-medium mb-4">Ventas por método de pago</h2>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          Sin ventas confirmadas en este período.
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((item) => {
            const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
            return (
              <li key={item.methodName} className="py-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium">
                    {METHOD_LABELS[item.methodType] ?? item.methodName}
                  </span>
                  <span className="text-sm font-medium">${item.revenue.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Progress bar */}
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-gold rounded-full"
                      style={{ width: `${pct.toFixed(1)}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary w-10 text-right">
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  {item.orderCount} pedido{item.orderCount !== 1 ? 's' : ''}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
