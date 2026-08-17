import Link from 'next/link'
import type { CustomerProfile, OrderListItem } from '../types'
import { ORDER_STATUS_LABEL } from './OrderStatusBadge'

interface Props {
  customer: CustomerProfile | null
  orders: OrderListItem[]
  userName?: string
}

export function ResumenView({ customer, orders, userName }: Props) {
  const recentOrders = orders.slice(0, 3)
  const pendingOrders = orders.filter(
    (o) =>
      o.status === 'pending_payment' ||
      o.status === 'payment_under_review' ||
      o.status === 'paid' ||
      o.status === 'preparing' ||
      o.status === 'shipped',
  )

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Pedidos totales" value={customer?.totalOrders ?? 0} />
        <StatCard label="En camino" value={pendingOrders.length} />
        <StatCard
          label="Gasto total"
          value={`$${parseFloat(customer?.totalSpentUsd ?? '0').toFixed(2)}`}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-base">Pedidos recientes</h2>
          <Link
            href="/mi-cuenta/pedidos"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <ul className="space-y-3">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/mi-cuenta/pedidos/${order.orderNumber}`}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-border-hover transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium group-hover:underline">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {order.createdAt.toLocaleDateString('es-VE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${parseFloat(order.totalUsd).toFixed(2)}</p>
                    <span className="text-xs text-text-secondary">
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="font-medium text-base mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickLink href="/mi-cuenta/direcciones" label="Mis direcciones" />
          <QuickLink href="/mi-cuenta/wishlist" label="Wishlist" />
          <QuickLink href="/mi-cuenta/perfil" label="Mi perfil" />
          <QuickLink href="/mi-cuenta/seguridad" label="Seguridad" />
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string
  value: string | number
  className?: string
}) {
  return (
    <div
      className={`border border-border rounded-lg p-4 ${className ?? ''}`}
    >
      <p className="text-2xl font-medium">{value}</p>
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block border border-border rounded-lg p-4 text-sm hover:border-border-hover hover:bg-surface-2 transition-colors"
    >
      {label} →
    </Link>
  )
}

function EmptyOrders() {
  return (
    <div className="border border-border rounded-lg p-8 text-center">
      <p className="text-text-secondary text-sm mb-4">Aún no tienes pedidos.</p>
      <Link
        href="/"
        className="inline-block bg-accent-gold text-text-primary-inverse text-sm px-5 py-2 rounded-full hover:bg-accent-gold-hover transition-colors"
      >
        Ver productos
      </Link>
    </div>
  )
}
