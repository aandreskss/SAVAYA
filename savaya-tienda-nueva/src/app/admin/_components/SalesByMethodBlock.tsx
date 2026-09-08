'use client'

import { useEffect, useState } from 'react'
import type { SalesByMethodItem } from '@/domains/admin/dashboard/types'

const METHOD_LABELS: Record<string, string> = {
  zelle: 'Zelle',
  pago_movil: 'Pago Móvil',
  bank_transfer: 'Transf. bancaria',
  usdt_trc20: 'USDT TRC-20',
  binance_pay: 'Binance Pay',
  cash: 'Efectivo',
}

const METHOD_COLORS: Record<string, string> = {
  zelle: '#4A90D9',
  pago_movil: '#2ECC71',
  bank_transfer: '#9B59B6',
  usdt_trc20: '#1ABC9C',
  binance_pay: '#F1C40F',
  cash: '#E67E22',
}

const GOLD = '#CA8C31'

export function SalesByMethodBlock({ items }: { items: SalesByMethodItem[] }) {
  const [mounted, setMounted] = useState(false)
  const totalRevenue = items.reduce((sum, i) => sum + i.revenue, 0)

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 120)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold mb-4">Ventas por método de pago</h2>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          Sin ventas confirmadas en este período.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item, index) => {
            const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
            const color = METHOD_COLORS[item.methodType] ?? GOLD

            return (
              <li key={item.methodName}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-sm font-medium">
                      {METHOD_LABELS[item.methodType] ?? item.methodName}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    ${item.revenue.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        background: color,
                        width: mounted ? `${pct.toFixed(1)}%` : '0%',
                        transition: `width 0.75s cubic-bezier(0.4, 0, 0.2, 1) ${index * 80}ms`,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-muted w-9 text-right tabular-nums">
                    {pct.toFixed(0)}%
                  </span>
                </div>

                <p className="text-xs text-text-muted mt-0.5">
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
