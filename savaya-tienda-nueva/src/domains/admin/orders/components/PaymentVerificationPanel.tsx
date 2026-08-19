'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { OrderStatusBadge } from './OrderStatusBadge'
import { PaymentProofViewer } from './PaymentProofViewer'
import { approvePaymentAction, rejectPaymentAction } from '../actions'
import { toast } from '@/shared/ui/toast-store'
import type { PendingPaymentItem } from '../types'

export function PaymentVerificationPanel({ items }: { items: PendingPaymentItem[] }) {
  const [selected, setSelected] = useState<PendingPaymentItem | null>(items[0] ?? null)
  const [isPending, startTransition] = useTransition()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (items.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-medium">Sin pagos pendientes</p>
        <p className="text-sm text-text-secondary mt-1">No hay comprobantes esperando revisión.</p>
      </div>
    )
  }

  function handleApprove() {
    if (!selected) return
    startTransition(async () => {
      const result = await approvePaymentAction({
        proofId: selected.proof.id,
        orderId: selected.orderId,
        orderNumber: selected.orderNumber,
      })
      if (result.success) {
        toast.success('Pago aprobado correctamente')
        setSelected(items.find((i) => i.orderId !== selected.orderId) ?? null)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleRejectConfirm() {
    if (!selected || rejectReason.trim().length < 5) return
    const reason = rejectReason.trim()
    startTransition(async () => {
      const result = await rejectPaymentAction({
        proofId: selected.proof.id,
        orderId: selected.orderId,
        reason,
        orderNumber: selected.orderNumber,
      })
      if (result.success) {
        toast.success('Pago rechazado')
        setShowRejectModal(false)
        setRejectReason('')
        setSelected(items.find((i) => i.orderId !== selected.orderId) ?? null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
      {/* Queue list */}
      <aside>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">
          {items.length} pendiente{items.length !== 1 ? 's' : ''}
        </p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.orderId}>
              <button
                onClick={() => setSelected(item)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selected?.orderId === item.orderId
                    ? 'border-accent-gold bg-accent-gold text-text-primary-inverse'
                    : 'border-border bg-surface hover:border-accent-gold/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-medium">{item.orderNumber}</span>
                  <span className="text-xs opacity-70">
                    {new Date(item.createdAt).toLocaleDateString('es-VE', {
                      day: '2-digit', month: 'short',
                    })}
                  </span>
                </div>
                <p className="text-sm font-medium truncate">{item.customerName}</p>
                <p className="text-xs opacity-70">${item.totalUsd}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Detail panel */}
      {selected ? (
        <div className="space-y-5">
          {/* Order summary */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-medium">{selected.orderNumber}</span>
                  <OrderStatusBadge status="payment_under_review" />
                </div>
                <p className="text-sm text-text-secondary">{selected.customerName} · {selected.customerEmail}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${selected.totalUsd}</p>
                <p className="text-xs text-text-secondary">Bs. {selected.totalBs}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/pedidos/${selected.orderNumber}`}
                className="text-xs text-text-secondary hover:underline"
                target="_blank"
              >
                Ver pedido completo ↗
              </Link>
            </div>
          </div>

          {/* Proof viewer */}
          <PaymentProofViewer
            proof={selected.proof}
            orderId={selected.orderId}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="ghost"
              isLoading={isPending}
              onClick={() => setShowRejectModal(true)}
              className="border border-error/30 text-error hover:bg-error/5"
            >
              Rechazar pago
            </Button>
            <Button
              variant="primary"
              isLoading={isPending}
              onClick={handleApprove}
            >
              Aprobar pago
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-secondary">
          Selecciona un pago de la lista para revisarlo.
        </div>
      )}

      {/* Reject modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectReason('') }}
        title="Rechazar pago"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Indica el motivo del rechazo. El pedido pasará a{' '}
            <strong>Pago rechazado</strong> y el cliente recibirá una notificación.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">
              Motivo <span className="text-error">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-gold/20"
              placeholder="Ej: El número de referencia no coincide con nuestros registros…"
            />
            {rejectReason.trim().length > 0 && rejectReason.trim().length < 5 && (
              <p className="text-xs text-error mt-1">Mínimo 5 caracteres</p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowRejectModal(false); setRejectReason('') }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isPending}
              onClick={handleRejectConfirm}
              disabled={rejectReason.trim().length < 5}
            >
              Confirmar rechazo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
