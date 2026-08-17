import { Badge } from '@/shared/ui/Badge'
import type { BadgeVariant } from '@/shared/ui/Badge'
import type { OrderStatus } from '@/domains/orders/state-machine'

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  pending_payment:       { label: 'Pago pendiente',   variant: 'outline' },
  payment_under_review:  { label: 'En revisión',      variant: 'warning' },
  payment_rejected:      { label: 'Pago rechazado',   variant: 'error' },
  paid:                  { label: 'Pagado',            variant: 'success' },
  preparing:             { label: 'Preparando',        variant: 'gold' },
  shipped:               { label: 'Enviado',           variant: 'gold' },
  delivered:             { label: 'Entregado',         variant: 'success' },
  cancelled:             { label: 'Cancelado',         variant: 'error' },
  refunded:              { label: 'Reembolsado',       variant: 'outline' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'outline' as BadgeVariant }
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>
}

export function ProofStatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const config = {
    pending:  { label: 'Pendiente', variant: 'warning' as BadgeVariant },
    approved: { label: 'Aprobado',  variant: 'success' as BadgeVariant },
    rejected: { label: 'Rechazado', variant: 'error'   as BadgeVariant },
  }[status]
  return <Badge variant={config.variant} size="sm">{config.label}</Badge>
}
