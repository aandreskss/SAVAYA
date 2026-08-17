import Link from 'next/link'
import { getLowStockItems } from '@/domains/admin/dashboard/repository'
import { cn } from '@/shared/lib/utils'

export async function LowStockBlock() {
  const items = await getLowStockItems()

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">Stock bajo</h2>
        {items.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 bg-warning text-white text-xs rounded-full font-medium">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          Todos los productos tienen stock suficiente.
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((item) => (
            <li key={item.variantId} className="py-3">
              <Link
                href={`/admin/inventario?variant=${item.variantId}`}
                className="flex items-start justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:underline truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {item.colorName} · Talla {item.sizeName} · SKU {item.sku}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-full text-xs font-medium',
                    item.available === 0
                      ? 'bg-error/10 text-error'
                      : 'bg-warning/10 text-warning',
                  )}
                >
                  {item.available === 0 ? 'Agotado' : item.available}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <Link
          href="/admin/inventario"
          className="block text-center text-xs text-text-secondary hover:text-text-primary mt-3 pt-3 border-t border-border transition-colors"
        >
          Ver inventario completo →
        </Link>
      )}
    </div>
  )
}
