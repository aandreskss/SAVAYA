import Link from 'next/link'
import type { OrderDetail } from '../types'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderTimeline } from './OrderTimeline'

interface Props {
  order: OrderDetail
}

export function PedidoDetailView({ order }: Props) {
  const shipping = order.shippingSnapshot as {
    methodName?: string
    zoneType?: string
    recipientName?: string
    address?: string
    city?: string
    state?: string
    municipality?: string
    reference?: string
  } | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/mi-cuenta/pedidos"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Mis pedidos
          </Link>
          <h2 className="font-medium text-lg mt-1">{order.orderNumber}</h2>
          <p className="text-sm text-text-secondary">
            {order.createdAt.toLocaleDateString('es-VE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Timeline */}
        <section className="border border-border rounded-lg p-5">
          <h3 className="font-medium text-sm mb-4">Estado del pedido</h3>
          <OrderTimeline currentStatus={order.status} history={order.statusHistory} />
        </section>

        {/* Products */}
        <section className="border border-border rounded-lg p-5">
          <h3 className="font-medium text-sm mb-4">Productos</h3>
          <ul className="space-y-3">
            {order.items.map((item) => {
              const snap = item.productSnapshot as {
                name?: string; productName?: string
                colorName?: string; color?: string
                sizeName?: string; size?: string
                imageUrl?: string
              }
              const displayName = snap.name ?? snap.productName
              const displayColor = snap.colorName ?? snap.color
              const displaySize = snap.sizeName ?? snap.size
              return (
                <li key={item.id} className="flex items-center gap-3">
                  {snap.imageUrl ? (
                    <img
                      src={snap.imageUrl}
                      alt={displayName ?? ''}
                      className="w-12 h-12 object-cover rounded-md bg-surface shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-surface rounded-md shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName ?? '—'}</p>
                    <p className="text-xs text-text-secondary">
                      {[displayColor, displaySize].filter(Boolean).join(' · ')} · ×
                      {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm shrink-0">
                    ${parseFloat(item.totalUsd).toFixed(2)}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {/* Totals + shipping */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Totals */}
        <section className="border border-border rounded-lg p-5">
          <h3 className="font-medium text-sm mb-4">Resumen de pago</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Subtotal" value={`$${parseFloat(order.subtotalUsd).toFixed(2)}`} />
            {parseFloat(order.discountUsd) > 0 && (
              <Row
                label="Descuento"
                value={`−$${parseFloat(order.discountUsd).toFixed(2)}`}
                className="text-success"
              />
            )}
            <Row label="Envío" value={`$${parseFloat(order.shippingCostUsd).toFixed(2)}`} />
            <div className="border-t border-border pt-2">
              <Row
                label="Total"
                value={`$${parseFloat(order.totalUsd).toFixed(2)}`}
                bold
              />
              <Row
                label={`Total Bs. (tasa ${parseFloat(order.exchangeRateSnapshot).toFixed(2)})`}
                value={`Bs. ${parseFloat(order.totalBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
              />
            </div>
            {order.paymentMethodName && (
              <Row label="Método de pago" value={order.paymentMethodName} />
            )}
            {order.reservationPaymentType && order.reservationPaymentType !== 'full' && (
              <Row
                label="Tipo de reserva"
                value={
                  order.reservationPaymentType === 'partial_20'
                    ? 'Reserva 20%'
                    : order.reservationPaymentType === 'partial_35'
                      ? 'Reserva 35%'
                      : 'Reserva 50%'
                }
              />
            )}
          </dl>
        </section>

        {/* Shipping */}
        {shipping && (
          <section className="border border-border rounded-lg p-5">
            <h3 className="font-medium text-sm mb-4">Entrega</h3>
            <dl className="text-sm text-text-secondary space-y-1">
              {shipping.methodName && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Método</dt>
                  <dd className="text-text-primary font-medium">{shipping.methodName}</dd>
                </div>
              )}
              {shipping.zoneType === 'pickup' && !shipping.methodName && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Tipo</dt>
                  <dd>Retiro en tienda</dd>
                </div>
              )}
              {shipping.recipientName && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Destinatario</dt>
                  <dd>{shipping.recipientName}</dd>
                </div>
              )}
              {shipping.address && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Dirección</dt>
                  <dd>{shipping.address}</dd>
                </div>
              )}
              {shipping.municipality && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Municipio</dt>
                  <dd>{shipping.municipality}</dd>
                </div>
              )}
              {(shipping.city || shipping.state) && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Ciudad/Estado</dt>
                  <dd>{[shipping.city, shipping.state].filter(Boolean).join(', ')}</dd>
                </div>
              )}
              {shipping.reference && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0">Referencia</dt>
                  <dd>{shipping.reference}</dd>
                </div>
              )}
            </dl>
          </section>
        )}
      </div>

      {order.notes && (
        <section className="border border-border rounded-lg p-5">
          <h3 className="font-medium text-sm mb-2">Notas del pedido</h3>
          <p className="text-sm text-text-secondary">{order.notes}</p>
        </section>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  bold,
  className,
}: {
  label: string
  value: string
  bold?: boolean
  className?: string
}) {
  return (
    <div className={`flex justify-between gap-4 ${bold ? 'font-medium' : ''} ${className ?? ''}`}>
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}
