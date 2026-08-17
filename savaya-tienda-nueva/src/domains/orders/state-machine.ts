// ---------------------------------------------------------------------------
// Order state machine — single source of truth for valid transitions.
// Import this in orders/service.ts — never inline transition logic elsewhere.
// ---------------------------------------------------------------------------

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_UNDER_REVIEW: 'payment_under_review',
  PAYMENT_REJECTED: 'payment_rejected',
  PAID: 'paid',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

/**
 * Map of valid transitions.
 * If `from` is not in the map, or `to` is not in the array for `from`,
 * the transition is invalid and the service must reject it.
 */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['payment_under_review', 'cancelled'],
  payment_under_review: ['paid', 'payment_rejected'],
  payment_rejected: ['pending_payment', 'cancelled'],
  paid: ['preparing', 'refunded'],
  preparing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
}

/** Terminal states — once reached, no further transitions are allowed */
export const TERMINAL_STATES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
])

/**
 * Returns true if transitioning from `from` to `to` is a valid transition.
 * Both values must be valid OrderStatus values.
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Returns a human-readable rejection reason for an invalid transition.
 * Useful for throwing typed errors in the service layer.
 */
export function getTransitionErrorMessage(
  from: OrderStatus,
  to: OrderStatus,
): string {
  if (from === ORDER_STATUS.PAID && to === ORDER_STATUS.PENDING_PAYMENT) {
    return 'Un pedido pagado no puede volver a pendiente.'
  }
  if (from === ORDER_STATUS.DELIVERED) {
    return 'Un pedido entregado no puede revertirse.'
  }
  if (from === ORDER_STATUS.CANCELLED) {
    return 'Un pedido cancelado no puede reactivarse.'
  }
  if (from === ORDER_STATUS.REFUNDED) {
    return 'Un pedido reembolsado no puede reactivarse.'
  }
  if (
    from === ORDER_STATUS.PENDING_PAYMENT &&
    to === ORDER_STATUS.PAID
  ) {
    return 'Un pedido pendiente no puede aprobarse directamente — debe revisarse el comprobante primero.'
  }
  return `Transición inválida: ${from} → ${to}`
}
