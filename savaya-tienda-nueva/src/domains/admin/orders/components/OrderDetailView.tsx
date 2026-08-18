'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { OrderStatusBadge } from './OrderStatusBadge'
import { PaymentProofViewer } from './PaymentProofViewer'
import { transitionOrderStatusAction, deleteOrderAction } from '../actions'
import { toast } from '@/shared/ui/toast-store'
import { VALID_TRANSITIONS } from '@/domains/orders/state-machine'
import type { AdminOrderDetail } from '../types'
import type { OrderStatus } from '@/domains/orders/state-machine'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment:       'Pago pendiente',
  payment_under_review:  'En revisión',
  payment_rejected:      'Pago rechazado',
  paid:                  'Pagado',
  preparing:             'Preparando',
  shipped:               'Enviado',
  delivered:             'Entregado',
  cancelled:             'Cancelado',
  refunded:              'Reembolsado',
}

export function OrderDetailView({ order }: { order: AdminOrderDetail }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmTransition, setConfirmTransition] = useState<OrderStatus | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reason, setReason] = useState('')

  const availableTransitions = VALID_TRANSITIONS[order.status] ?? []

  function handleTransition(toStatus: OrderStatus) {
    if (toStatus === 'cancelled' || toStatus === 'refunded') {
      setConfirmTransition(toStatus)
      return
    }
    startTransition(async () => {
      const result = await transitionOrderStatusAction({ orderId: order.id, toStatus })
      if (result.success) {
        toast.success(`Estado actualizado a: ${STATUS_LABELS[toStatus]}`)
      } else {
        toast.error(result.error)
      }
    })
  }

  function confirmDestructive() {
    if (!confirmTransition) return
    const ts = confirmTransition
    setConfirmTransition(null)
    startTransition(async () => {
      const result = await transitionOrderStatusAction({
        orderId: order.id,
        toStatus: ts,
        reason: reason || undefined,
      })
      if (result.success) {
        toast.success(`Estado actualizado a: ${STATUS_LABELS[ts]}`)
      } else {
        toast.error(result.error)
      }
      setReason('')
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin/pedidos" className="text-text-secondary hover:text-text-primary text-sm">
              ← Pedidos
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl uppercase tracking-wide">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            {new Date(order.createdAt).toLocaleString('es-VE', {
              day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTransitions.map((ts) => (
            <Button
              key={ts}
              variant={ts === 'cancelled' || ts === 'refunded' ? 'ghost' : 'secondary'}
              size="sm"
              isLoading={isPending}
              onClick={() => handleTransition(ts)}
            >
              {STATUS_LABELS[ts]}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            isLoading={isPending}
            onClick={() => setConfirmDelete(true)}
            className="text-error hover:bg-error/10 border-error/30"
          >
            Eliminar pedido
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-medium">Productos</h2>
            </div>
            <ul className="divide-y divide-border">
              {order.items.map((item) => {
                const snap = item.productSnapshot
                return (
                  <li key={item.id} className="px-5 py-4 flex gap-4">
                    {Boolean(snap.imageUrl) && (
                      // Product snapshot URL is arbitrary — next/image not applicable here
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={snap.imageUrl as string}
                        alt={snap.name as string}
                        className="w-14 h-14 object-cover rounded-lg shrink-0 border border-border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{snap.name as string}</p>
                      {Boolean(snap.colorName || snap.sizeName) && (
                        <p className="text-xs text-text-secondary">
                          {[snap.colorName as string | undefined, snap.sizeName as string | undefined].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="text-xs text-text-secondary mt-0.5">SKU: {snap.sku as string}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">${item.totalUsd}</p>
                      <p className="text-xs text-text-secondary">
                        {item.quantity} × ${item.unitPriceUsd}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Totals */}
            <div className="px-5 py-4 border-t border-border space-y-1.5 bg-surface-2/50">
              <Row label="Subtotal" value={`$${order.subtotalUsd}`} />
              {Number(order.discountUsd) > 0 && (
                <Row label="Descuento" value={`-$${order.discountUsd}`} className="text-success" />
              )}
              <Row label="Envío" value={`$${order.shippingCostUsd}`} />
              <div className="border-t border-border pt-2 mt-2">
                <Row label="Total USD" value={`$${order.totalUsd}`} bold />
                <Row label="Total Bs." value={`Bs. ${order.totalBs}`} />
                <p className="text-xs text-text-secondary mt-1">
                  Tasa usada: {order.exchangeRateSnapshot} Bs./$
                </p>
              </div>
            </div>
          </section>

          {/* Shipping */}
          {order.shippingSnapshot && (
            <section className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-medium mb-3">Entrega</h2>
              <ShippingDetail snapshot={order.shippingSnapshot} />
            </section>
          )}

          {/* Payment proof */}
          {order.proof && (
            <PaymentProofViewer
              proof={order.proof}
              orderId={order.id}
            />
          )}

          {/* Notes */}
          {order.notes && (
            <section className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-medium mb-2">Notas del cliente</h2>
              <p className="text-sm text-text-secondary">{order.notes}</p>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Customer */}
          <section className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-medium mb-3">Cliente</h2>
            <div className="space-y-1.5 text-sm">
              <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
              <a href={`mailto:${order.customer.email}`} className="text-text-secondary hover:underline block">
                {order.customer.email}
              </a>
              {order.customer.phone && (
                <p className="text-text-secondary">{order.customer.phone}</p>
              )}
              {order.customer.whatsapp && (
                <a
                  href={`https://wa.me/${order.customer.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-success hover:underline block"
                >
                  WhatsApp: {order.customer.whatsapp}
                </a>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <Link
                href={`/admin/clientes/${order.customer.id}`}
                className="text-xs text-text-secondary hover:text-text-primary hover:underline"
              >
                Ver ficha del cliente →
              </Link>
            </div>
          </section>

          {/* Payment method */}
          <section className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-medium mb-2">Pago</h2>
            <p className="text-sm text-text-secondary">
              {order.paymentMethodName ?? 'No especificado'}
            </p>
            {order.reservationPaymentType && (
              <p className="text-xs text-text-secondary mt-1">
                Tipo de reserva: {order.reservationPaymentType}
              </p>
            )}
          </section>

          {/* Timeline */}
          <section className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-medium mb-4">Historial</h2>
            <OrderTimeline events={order.statusHistory} />
          </section>
        </div>
      </div>

      {/* Confirm destructive transition modal */}
      <Modal
        isOpen={confirmTransition !== null}
        onClose={() => { setConfirmTransition(null); setReason('') }}
        title={confirmTransition ? `Confirmar: ${STATUS_LABELS[confirmTransition]}` : ''}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Esta acción{' '}
            {confirmTransition === 'cancelled' ? 'cancelará el pedido' : 'marcará el pedido como reembolsado'}.
            {' '}No se puede deshacer.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">
              Motivo <span className="text-text-secondary font-normal">(opcional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
              placeholder="Especifica el motivo…"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setConfirmTransition(null); setReason('') }}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" isLoading={isPending} onClick={confirmDestructive}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar pedido"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Vas a eliminar el pedido <span className="font-medium text-text-primary">{order.orderNumber}</span> de forma permanente.
            Esta acción libera el inventario reservado y ajusta el total del cliente.
          </p>
          <div className="p-3 bg-error/5 border border-error/20 rounded-lg text-sm text-error">
            Esta acción no se puede deshacer.
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              isLoading={isPending}
              className="text-error hover:bg-error/10"
              onClick={() => {
                setConfirmDelete(false)
                startTransition(async () => {
                  const result = await deleteOrderAction(order.id)
                  if (result.success) {
                    toast.success('Pedido eliminado')
                    router.push('/admin/pedidos')
                  } else {
                    toast.error(result.error)
                  }
                })
              }}
            >
              Eliminar permanentemente
            </Button>
          </div>
        </div>
      </Modal>
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
    <div className={`flex justify-between text-sm ${className ?? ''}`}>
      <span className={bold ? 'font-medium' : 'text-text-secondary'}>{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}

function ShippingDetail({ snapshot }: { snapshot: Record<string, unknown> }) {
  const fields = [
    { label: 'Método', value: snapshot.methodName as string | undefined },
    { label: 'Nombre', value: snapshot.recipientName as string | undefined },
    { label: 'Estado', value: snapshot.state as string | undefined },
    { label: 'Ciudad', value: snapshot.city as string | undefined },
    { label: 'Dirección', value: snapshot.address as string | undefined },
    { label: 'Referencia', value: snapshot.reference as string | undefined },
    { label: 'Costo', value: snapshot.costUsd ? `$${snapshot.costUsd}` : undefined },
  ]
  return (
    <dl className="space-y-1.5 text-sm">
      {fields.filter((f) => f.value).map((f) => (
        <div key={f.label} className="flex gap-2">
          <dt className="text-text-secondary w-24 shrink-0">{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function OrderTimeline({ events }: { events: AdminOrderDetail['statusHistory'] }) {
  if (events.length === 0) return <p className="text-sm text-text-secondary">Sin eventos aún.</p>

  return (
    <ol className="relative border-l border-border space-y-4 ml-2">
      {events.map((ev) => (
        <li key={ev.id} className="pl-4">
          <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-accent-gold border-2 border-surface" />
          <p className="text-sm font-medium">
            {ev.fromStatus ? `${STATUS_LABELS[ev.fromStatus]} → ` : ''}{STATUS_LABELS[ev.toStatus]}
          </p>
          {ev.reason && (
            <p className="text-xs text-text-secondary mt-0.5">{ev.reason}</p>
          )}
          <p className="text-xs text-text-secondary mt-0.5">
            {ev.actorEmail ? `${ev.actorEmail} · ` : ''}
            {new Date(ev.createdAt).toLocaleString('es-VE', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </li>
      ))}
    </ol>
  )
}
