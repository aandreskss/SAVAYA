'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { OrderStatusBadge } from './OrderStatusBadge'
import { PaymentProofViewer } from './PaymentProofViewer'
import {
  transitionOrderStatusAction,
  deleteOrderAction,
  approvePaymentAction,
  rejectPaymentAction,
} from '../actions'
import { toast } from '@/shared/ui/toast-store'
import { VALID_TRANSITIONS } from '@/domains/orders/state-machine'
import type { AdminOrderDetail } from '../types'
import type { OrderStatus } from '@/domains/orders/state-machine'
import { toWaPhone } from '@/shared/lib/phone'

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
    // Destructive transitions always require confirmation + reason
    if (toStatus === 'cancelled' || toStatus === 'refunded' || toStatus === 'payment_rejected') {
      setConfirmTransition(toStatus)
      return
    }
    // Payment approval: must go through approvePaymentAction to also update proof status
    if (toStatus === 'paid' && order.status === 'payment_under_review' && order.proof) {
      startTransition(async () => {
        const result = await approvePaymentAction({
          proofId: order.proof!.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
        })
        if (result.success) {
          toast.success('Pago aprobado')
        } else {
          toast.error(result.error)
        }
      })
      return
    }
    // Regular status transitions
    startTransition(async () => {
      const result = await transitionOrderStatusAction({
        orderId: order.id,
        toStatus,
        orderNumber: order.orderNumber,
      })
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
      // Payment rejection: must go through rejectPaymentAction to also update proof status
      if (ts === 'payment_rejected' && order.proof) {
        const result = await rejectPaymentAction({
          proofId: order.proof.id,
          orderId: order.id,
          reason: reason || 'Rechazado por administrador',
          orderNumber: order.orderNumber,
        })
        if (result.success) {
          toast.success('Pago rechazado')
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await transitionOrderStatusAction({
          orderId: order.id,
          toStatus: ts,
          reason: reason || undefined,
          orderNumber: order.orderNumber,
        })
        if (result.success) {
          toast.success(`Estado actualizado a: ${STATUS_LABELS[ts]}`)
        } else {
          toast.error(result.error)
        }
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
              variant={ts === 'cancelled' || ts === 'refunded' || ts === 'payment_rejected' ? 'ghost' : 'secondary'}
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
                // Support both new keys (name/colorName/sizeName) and legacy keys (productName/color/size)
                const displayName = (snap.name ?? snap.productName) as string | undefined
                const displayColor = (snap.colorName ?? snap.color) as string | undefined
                const displaySize = (snap.sizeName ?? snap.size) as string | undefined
                return (
                  <li key={item.id} className="px-5 py-4 flex gap-4">
                    {Boolean(snap.imageUrl) && (
                      // Product snapshot URL is arbitrary — next/image not applicable here
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={snap.imageUrl as string}
                        alt={displayName ?? ''}
                        className="w-14 h-14 object-cover rounded-lg shrink-0 border border-border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{displayName ?? '—'}</p>
                      {Boolean(displayColor || displaySize) && (
                        <p className="text-xs text-text-secondary">
                          {[displayColor, displaySize].filter(Boolean).join(' · ')}
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
                  href={`https://wa.me/${toWaPhone(order.customer.whatsapp)}`}
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

          {/* WhatsApp notifications */}
          <section className="bg-surface border border-border rounded-xl p-5">
            <h2 className="font-medium mb-3">Notificar al cliente</h2>
            <WhatsAppNotifications
              whatsapp={order.customer.whatsapp}
              orderNumber={order.orderNumber}
              customerName={order.customer.firstName}
              currentStatus={order.status}
            />
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
            {confirmTransition === 'cancelled' && 'Esta acción cancelará el pedido. No se puede deshacer.'}
            {confirmTransition === 'refunded' && 'Esta acción marcará el pedido como reembolsado. No se puede deshacer.'}
            {confirmTransition === 'payment_rejected' && 'El comprobante será rechazado y el pedido volverá a pago pendiente.'}
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">
              Motivo{' '}
              <span className="text-text-secondary font-normal">
                {confirmTransition === 'payment_rejected' ? '(obligatorio para el cliente)' : '(opcional)'}
              </span>
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
  const isPickup = snapshot.zoneType === 'pickup'
  const fields = [
    { label: 'Tipo', value: isPickup && !snapshot.methodName ? 'Retiro en tienda' : undefined },
    { label: 'Método', value: snapshot.methodName as string | undefined },
    { label: 'Destinatario', value: snapshot.recipientName as string | undefined },
    { label: 'Dirección', value: snapshot.address as string | undefined },
    { label: 'Municipio', value: snapshot.municipality as string | undefined },
    { label: 'Parroquia', value: snapshot.parish as string | undefined },
    {
      label: 'Ciudad / Estado',
      value: [snapshot.city, snapshot.state].filter(Boolean).join(', ') || undefined,
    },
    { label: 'Referencia', value: snapshot.reference as string | undefined },
    { label: 'Costo envío', value: snapshot.costUsd ? `$${snapshot.costUsd}` : undefined },
  ]
  return (
    <dl className="space-y-1.5 text-sm">
      {fields.filter((f) => f.value).map((f) => (
        <div key={f.label} className="flex gap-2">
          <dt className="text-text-secondary w-28 shrink-0">{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

// ── WhatsApp notifications ────────────────────────────────────────────────────

const WA_MESSAGES: Partial<Record<OrderStatus, (name: string, orderNumber: string) => string>> = {
  paid: (name, num) =>
    `¡Hola ${name}! 🎉 Tu pago del pedido *${num}* fue *aprobado* ✅. Ya estamos preparando tu pedido con mucho cariño. Pronto te avisamos cuando esté en camino. ¡Gracias por elegir SAVAYA! 🦋`,
  preparing: (name, num) =>
    `¡Hola ${name}! Tu pedido *${num}* está siendo preparado 📦. En breve te avisamos cuando salga a despacho. ¡Gracias por tu paciencia!`,
  shipped: (name, num) =>
    `¡Hola ${name}! Tu pedido *${num}* ya fue despachado 🚚. Pronto llegará a tus manos. Cualquier consulta, aquí estamos. ¡Gracias por comprar en SAVAYA! 🦋`,
  delivered: (name, num) =>
    `¡Hola ${name}! Esperamos que hayas recibido tu pedido *${num}* con éxito 🎉. Nos encantaría saber qué te pareció. ¡Gracias por tu compra en SAVAYA! 🦋`,
  payment_rejected: (name, num) =>
    `¡Hola ${name}! Lamentablemente tu comprobante de pago del pedido *${num}* no pudo ser verificado. Por favor envíanos un nuevo comprobante o escríbenos para ayudarte. Gracias.`,
}

const WA_STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  paid: 'Pago aprobado',
  preparing: 'En preparación',
  shipped: 'Pedido enviado',
  delivered: 'Entregado',
  payment_rejected: 'Pago rechazado',
}

function WhatsAppNotifications({
  whatsapp,
  orderNumber,
  customerName,
  currentStatus,
}: {
  whatsapp: string | null
  orderNumber: string
  customerName: string
  currentStatus: OrderStatus
}) {
  if (!whatsapp) {
    return (
      <p className="text-xs text-text-secondary italic">
        El cliente no tiene WhatsApp registrado.
      </p>
    )
  }

  const cleanPhone = toWaPhone(whatsapp)

  return (
    <div className="space-y-2">
      {(Object.keys(WA_MESSAGES) as OrderStatus[]).map((status) => {
        const label = WA_STATUS_LABELS[status]
        const msgFn = WA_MESSAGES[status]
        if (!label || !msgFn) return null
        const isCurrent = status === currentStatus
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgFn(customerName, orderNumber))}`
        return (
          <a
            key={status}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isCurrent
                ? 'bg-success/10 border border-success/30 text-success font-medium'
                : 'border border-border hover:border-success/40 hover:text-success text-text-secondary'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="flex-1">{label}</span>
            {isCurrent && (
              <span className="text-xs opacity-60">actual</span>
            )}
          </a>
        )
      })}
    </div>
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
