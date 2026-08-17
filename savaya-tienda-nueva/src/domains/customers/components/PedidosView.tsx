import Link from 'next/link'
import type { OrderListItem } from '../types'
import { OrderStatusBadge } from './OrderStatusBadge'

interface Props {
  orders: OrderListItem[]
}

export function PedidosView({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="border border-border rounded-lg p-10 text-center">
        <p className="text-text-secondary mb-4">Aún no has realizado ningún pedido.</p>
        <Link
          href="/"
          className="inline-block bg-accent-gold text-text-primary-inverse text-sm px-5 py-2 rounded-full hover:bg-accent-gold-hover transition-colors"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/mi-cuenta/pedidos/${order.orderNumber}`}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-lg hover:border-border-hover transition-colors group"
        >
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            {order.firstItemSnapshot?.imageUrl ? (
              <img
                src={order.firstItemSnapshot.imageUrl}
                alt={order.firstItemSnapshot.name}
                className="w-12 h-12 object-cover rounded-md bg-surface shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-surface rounded-md shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="text-sm font-medium group-hover:underline">
                {order.orderNumber}
              </p>
              <p className="text-xs text-text-secondary">
                {order.itemCount} {order.itemCount === 1 ? 'artículo' : 'artículos'} ·{' '}
                {order.createdAt.toLocaleDateString('es-VE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
            <p className="text-sm font-medium">${parseFloat(order.totalUsd).toFixed(2)}</p>
            <OrderStatusBadge status={order.status} />
          </div>
        </Link>
      ))}
    </div>
  )
}
