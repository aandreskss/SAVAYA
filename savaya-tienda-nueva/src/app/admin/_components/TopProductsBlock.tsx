import Link from 'next/link'
import type { TopProductItem } from '@/domains/admin/dashboard/types'

const RANKS = [
  { bg: 'rgba(202,140,49,0.15)', color: '#CA8C31', border: 'rgba(202,140,49,0.4)' },  // gold
  { bg: 'rgba(156,163,175,0.12)', color: '#9CA3AF', border: 'rgba(156,163,175,0.35)' }, // silver
  { bg: 'rgba(180,115,80,0.12)', color: '#CD7F60', border: 'rgba(180,115,80,0.35)' },  // bronze
]

export function TopProductsBlock({ items }: { items: TopProductItem[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold mb-4">Productos más vendidos</h2>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          Sin ventas confirmadas en este período.
        </p>
      ) : (
        <ul className="divide-y divide-border/40">
          {items.map((item, idx) => {
            const rank = RANKS[idx]
            return (
              <li key={item.name} className="py-3 group">
                <div className="flex items-center gap-3">
                  <span
                    className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold border"
                    style={
                      rank
                        ? { background: rank.bg, color: rank.color, borderColor: rank.border }
                        : { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }
                    }
                  >
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    {item.slug ? (
                      <Link
                        href={`/admin/productos?slug=${item.slug}`}
                        className="text-sm font-medium hover:underline truncate block group-hover:text-text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium truncate">{item.name}</p>
                    )}
                    <p className="text-xs text-text-muted mt-0.5">
                      {item.unitsSold} unidad{item.unitsSold !== 1 ? 'es' : ''}
                    </p>
                  </div>

                  <p className="text-sm font-semibold shrink-0 tabular-nums">
                    ${item.revenue.toFixed(2)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
