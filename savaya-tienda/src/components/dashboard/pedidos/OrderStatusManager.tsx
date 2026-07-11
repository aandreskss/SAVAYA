'use client'

import { useState, useTransition } from 'react'
import { ORDER_STATUS_CONFIG } from '@/lib/constants'
import { updateOrderStatus, updateTrackingNumber } from '@/app/dashboard/pedidos/actions'
import type { OrderStatus } from '@/lib/types'

interface Props {
  orderId: string
  currentStatus: OrderStatus
  orderEmail: string
  orderNumber: string
  currentTrackingNumber: string | null
}

const TERMINAL_STATUSES: OrderStatus[] = ['cancelled', 'returned']

const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
]

export default function OrderStatusManager({
  orderId,
  currentStatus,
  orderEmail,
  orderNumber,
  currentTrackingNumber,
}: Props) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus)
  const [tracking, setTracking] = useState(currentTrackingNumber ?? '')
  const [statusError, setStatusError] = useState('')
  const [trackingError, setTrackingError] = useState('')
  const [trackingSaved, setTrackingSaved] = useState(false)
  const [isPendingStatus, startStatusTransition] = useTransition()
  const [isPendingTracking, startTrackingTransition] = useTransition()
  const [isPendingRefund, startRefundTransition] = useTransition()

  const isTerminal = TERMINAL_STATUSES.includes(currentStatus)
  const statusChanged = selectedStatus !== currentStatus

  function handleStatusChange() {
    if (!statusChanged) return
    setStatusError('')
    startStatusTransition(async () => {
      const result = await updateOrderStatus(
        orderId,
        selectedStatus,
        currentStatus,
        orderEmail,
        orderNumber,
      )
      if ('error' in result) setStatusError(result.error)
    })
  }

  function handleSaveTracking() {
    setTrackingError('')
    setTrackingSaved(false)
    startTrackingTransition(async () => {
      const result = await updateTrackingNumber(orderId, tracking)
      if ('error' in result) {
        setTrackingError(result.error)
      } else {
        setTrackingSaved(true)
        setTimeout(() => setTrackingSaved(false), 3000)
      }
    })
  }

  function handleRefund() {
    const confirmed = window.confirm(
      `¿Marcar el pedido ${orderNumber} como reembolsado? Esta acción cambiará el estado a "Devuelto".`
    )
    if (!confirmed) return
    startRefundTransition(async () => {
      await updateOrderStatus(orderId, 'returned', currentStatus, orderEmail, orderNumber)
    })
  }

  return (
    <div className="bg-white rounded border border-gray-light p-5 space-y-5">
      <h2 className="text-sm font-heading font-semibold text-black">Gestión del pedido</h2>

      {/* Status change */}
      <div>
        <label className="block text-xs font-heading font-semibold text-gray-text uppercase tracking-wider mb-2">
          Cambiar estado
        </label>
        {isTerminal ? (
          <p className="text-sm font-body text-gray-text">
            Este pedido está en estado final y no puede cambiarse.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                disabled={isPendingStatus}
                className="flex-1 border border-gray-light rounded px-3 py-2 text-sm font-body focus:border-black focus:outline-none transition-colors disabled:opacity-50"
              >
                {STATUS_FLOW.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_CONFIG[s].label}
                  </option>
                ))}
                <option value="cancelled">{ORDER_STATUS_CONFIG.cancelled.label}</option>
              </select>
              <button
                onClick={handleStatusChange}
                disabled={!statusChanged || isPendingStatus}
                className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-xs px-4 py-2 rounded hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isPendingStatus && (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Guardar
              </button>
            </div>
            {statusError && (
              <p className="text-xs text-sale font-body">{statusError}</p>
            )}
            {!statusError && isPendingStatus === false && statusChanged && (
              <p className="text-[11px] text-gray-text font-body">
                Se enviará un email de notificación al cliente.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tracking number */}
      <div className="pt-4 border-t border-gray-light">
        <label className="block text-xs font-heading font-semibold text-gray-text uppercase tracking-wider mb-2">
          Número de seguimiento
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tracking}
            onChange={(e) => { setTracking(e.target.value); setTrackingSaved(false) }}
            placeholder="Ej: CO123456789"
            disabled={isPendingTracking}
            className="flex-1 border border-gray-light rounded px-3 py-2 text-sm font-body focus:border-black focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSaveTracking}
            disabled={isPendingTracking}
            className="flex items-center gap-2 border border-black text-black font-heading font-semibold text-xs px-4 py-2 rounded hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isPendingTracking && (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {trackingSaved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
        {trackingError && (
          <p className="text-xs text-sale font-body mt-1">{trackingError}</p>
        )}
      </div>

      {/* Refund button */}
      {!isTerminal && (
        <div className="pt-4 border-t border-gray-light">
          <button
            onClick={handleRefund}
            disabled={isPendingRefund}
            className="flex items-center gap-2 w-full justify-center text-sm font-body text-sale border border-sale/30 rounded px-4 py-2.5 hover:bg-sale/5 transition-colors disabled:opacity-50"
          >
            {isPendingRefund && (
              <span className="w-3 h-3 border-2 border-sale border-t-transparent rounded-full animate-spin" />
            )}
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M3 12a9 9 0 109 9" />
              <polyline points="3 3 3 12 12 12" />
            </svg>
            Marcar como reembolsado
          </button>
        </div>
      )}
    </div>
  )
}
