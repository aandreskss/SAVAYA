import Link from 'next/link'
import { getTopProducts } from '@/domains/admin/dashboard/repository'

export async function TopProductsBlock({ start, end }: { start: Date; end: Date }) {
  const items = await getTopProducts(start, end)

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-medium mb-4">Productos más vendidos</h2>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          Sin ventas confirmadas en este período.
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((item, idx) => (
            <li key={item.name} className="py-3">
              <div className="flex items-center gap-3">
                <span className="shrink-0 w-5 text-xs text-text-secondary text-right">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {item.slug ? (
                    <Link
                      href={`/admin/productos?slug=${item.slug}`}
                      className="text-sm font-medium hover:underline truncate block"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium truncate">{item.name}</p>
                  )}
                  <p className="text-xs text-text-secondary mt-0.5">
                    {item.unitsSold} unidad{item.unitsSold !== 1 ? 'es' : ''}
                  </p>
                </div>
                <p className="text-sm font-medium shrink-0">
                  ${item.revenue.toFixed(2)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
