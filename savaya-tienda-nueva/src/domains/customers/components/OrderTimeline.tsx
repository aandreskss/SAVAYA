import { cn } from '@/shared/lib/utils'
import type { OrderStatus } from '@/domains/orders/state-machine'
import type { OrderStatusEvent } from '../types'

// ---------------------------------------------------------------------------
// Timeline definition — linear happy path shown to the customer
// ---------------------------------------------------------------------------

type TimelineStep = {
  status: OrderStatus
  label: string
}

const TIMELINE_STEPS: TimelineStep[] = [
  { status: 'pending_payment', label: 'Pedido creado' },
  { status: 'payment_under_review', label: 'Comprobante enviado' },
  { status: 'paid', label: 'Pago aprobado' },
  { status: 'preparing', label: 'Preparando' },
  { status: 'shipped', label: 'Enviado' },
  { status: 'delivered', label: 'Entregado' },
]

// Statuses that indicate a negative outcome
const NEGATIVE_STATUSES: Set<OrderStatus> = new Set([
  'payment_rejected',
  'cancelled',
  'refunded',
])

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending_payment: 0,
  payment_under_review: 1,
  payment_rejected: 1, // same level as under_review
  paid: 2,
  preparing: 3,
  shipped: 4,
  delivered: 5,
  cancelled: -1,
  refunded: -1,
}

// ---------------------------------------------------------------------------
// OrderTimeline
// ---------------------------------------------------------------------------

interface Props {
  currentStatus: OrderStatus
  history: OrderStatusEvent[]
}

export function OrderTimeline({ currentStatus, history }: Props) {
  const isNegative = NEGATIVE_STATUSES.has(currentStatus)
  const currentOrder = STATUS_ORDER[currentStatus] ?? -1

  if (isNegative) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-4">
        <p className="text-sm font-medium text-error">
          {currentStatus === 'payment_rejected' && '❌ Comprobante de pago rechazado'}
          {currentStatus === 'cancelled' && '❌ Pedido cancelado'}
          {currentStatus === 'refunded' && '↩ Pedido reembolsado'}
        </p>
        {history.length > 0 && (
          <p className="text-xs text-text-secondary mt-1">
            Última actualización:{' '}
            {history[history.length - 1].createdAt.toLocaleDateString('es-VE', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    )
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {TIMELINE_STEPS.map((step, index) => {
        const stepOrder = STATUS_ORDER[step.status]
        const isDone = stepOrder < currentOrder
        const isActive = step.status === currentStatus
        const isPending = stepOrder > currentOrder
        const isLast = index === TIMELINE_STEPS.length - 1

        // Find the history event for this step
        const event = history.find((h) => h.toStatus === step.status)

        return (
          <li key={step.status} className="flex items-start gap-3">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10',
                  isDone && 'border-accent-gold bg-accent-gold',
                  isActive && 'border-accent-gold bg-surface',
                  isPending && 'border-border bg-surface',
                )}
                aria-hidden="true"
              >
                {isDone && (
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {isActive && (
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-gold" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 my-1',
                    isDone ? 'bg-accent-gold' : 'bg-border',
                  )}
                  style={{ minHeight: '1.5rem' }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm',
                  isDone || isActive ? 'font-medium text-text-primary' : 'text-text-secondary',
                )}
              >
                {step.label}
              </p>
              {event && (
                <p className="text-xs text-text-secondary mt-0.5">
                  {event.createdAt.toLocaleDateString('es-VE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              {isActive && !event && (
                <p className="text-xs text-text-secondary mt-0.5">En curso</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
