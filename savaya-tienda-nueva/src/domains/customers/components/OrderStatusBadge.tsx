import { cn } from '@/shared/lib/utils'
import type { OrderStatus } from '@/domains/orders/state-machine'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente de pago',
  payment_under_review: 'Comprobante en revisión',
  payment_rejected: 'Pago rechazado',
  paid: 'Pago aprobado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending_payment: 'bg-warning/10 text-amber-700',
  payment_under_review: 'bg-blue-50 text-blue-700',
  payment_rejected: 'bg-error/10 text-error',
  paid: 'bg-success/10 text-green-700',
  preparing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-success/10 text-green-700',
  cancelled: 'bg-surface text-text-secondary',
  refunded: 'bg-surface text-text-secondary',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        STATUS_STYLE[status],
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  )
}
