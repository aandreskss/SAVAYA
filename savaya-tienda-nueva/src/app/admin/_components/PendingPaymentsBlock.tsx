import Link from 'next/link'
import { getPendingPayments } from '@/domains/admin/dashboard/repository'

function RelativeTime({ iso }: { iso: string }) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffH = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffH < 1) return <span>Hace menos de 1 h</span>
  if (diffH < 24) return <span>Hace {diffH} h</span>
  const diffD = Math.floor(diffH / 24)
  return <span>Hace {diffD} día{diffD > 1 ? 's' : ''}</span>
}

export async function PendingPaymentsBlock() {
  const items = await getPendingPayments()

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">Pagos pendientes de revisión</h2>
        {items.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 bg-error text-white text-xs rounded-full font-medium">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary py-6 text-center">
          Sin pagos pendientes. ¡Todo al día!
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.map((item) => (
            <li key={item.proofId} className="py-3">
              <Link
                href={`/admin/pagos/${item.orderId}`}
                className="flex items-start justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:underline truncate">
                    {item.orderNumber}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5 truncate">
                    {item.customerName} · {item.paymentMethodName}
                  </p>
                  <p className="text-xs text-text-secondary">
                    <RelativeTime iso={item.submittedAt} />
                  </p>
                </div>
                <p className="text-sm font-medium shrink-0">
                  ${item.totalUsd.toFixed(2)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <Link
          href="/admin/pagos"
          className="block text-center text-xs text-text-secondary hover:text-text-primary mt-3 pt-3 border-t border-border transition-colors"
        >
          Ver todos los pagos →
        </Link>
      )}
    </div>
  )
}
