import { describe, it, expect } from 'vitest'
import {
  isValidTransition,
  getTransitionErrorMessage,
  TERMINAL_STATES,
  ORDER_STATUS,
} from '@/domains/orders/state-machine'

// ---------------------------------------------------------------------------
// isValidTransition
// ---------------------------------------------------------------------------

describe('isValidTransition', () => {
  it('permite pending_payment → payment_under_review', () => {
    expect(isValidTransition('pending_payment', 'payment_under_review')).toBe(true)
  })

  it('permite pending_payment → cancelled', () => {
    expect(isValidTransition('pending_payment', 'cancelled')).toBe(true)
  })

  it('bloquea pending_payment → paid (sin pasar por revisión)', () => {
    expect(isValidTransition('pending_payment', 'paid')).toBe(false)
  })

  it('permite payment_under_review → paid', () => {
    expect(isValidTransition('payment_under_review', 'paid')).toBe(true)
  })

  it('permite payment_under_review → payment_rejected', () => {
    expect(isValidTransition('payment_under_review', 'payment_rejected')).toBe(true)
  })

  it('bloquea transiciones desde estado terminal delivered', () => {
    expect(isValidTransition('delivered', 'refunded')).toBe(false)
    expect(isValidTransition('delivered', 'cancelled')).toBe(false)
  })

  it('bloquea transiciones desde estado terminal cancelled', () => {
    expect(isValidTransition('cancelled', 'pending_payment')).toBe(false)
  })

  it('permite el flujo completo happy path', () => {
    const happy: Array<[string, string]> = [
      ['pending_payment', 'payment_under_review'],
      ['payment_under_review', 'paid'],
      ['paid', 'preparing'],
      ['preparing', 'shipped'],
      ['shipped', 'delivered'],
    ]
    for (const [from, to] of happy) {
      expect(
        isValidTransition(from as Parameters<typeof isValidTransition>[0], to as Parameters<typeof isValidTransition>[1]),
        `${from} → ${to}`,
      ).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// TERMINAL_STATES
// ---------------------------------------------------------------------------

describe('TERMINAL_STATES', () => {
  it('incluye delivered, cancelled, refunded', () => {
    expect(TERMINAL_STATES.has(ORDER_STATUS.DELIVERED)).toBe(true)
    expect(TERMINAL_STATES.has(ORDER_STATUS.CANCELLED)).toBe(true)
    expect(TERMINAL_STATES.has(ORDER_STATUS.REFUNDED)).toBe(true)
  })

  it('no incluye estados activos', () => {
    expect(TERMINAL_STATES.has(ORDER_STATUS.PENDING_PAYMENT)).toBe(false)
    expect(TERMINAL_STATES.has(ORDER_STATUS.PAID)).toBe(false)
    expect(TERMINAL_STATES.has(ORDER_STATUS.SHIPPED)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getTransitionErrorMessage
// ---------------------------------------------------------------------------

describe('getTransitionErrorMessage', () => {
  it('devuelve mensaje para transición inválida genérica', () => {
    const msg = getTransitionErrorMessage('pending_payment', 'delivered')
    expect(msg).toContain('pending_payment')
    expect(msg).toContain('delivered')
  })

  it('devuelve mensaje específico para pedido pagado → pendiente', () => {
    const msg = getTransitionErrorMessage('paid', 'pending_payment')
    expect(msg.length).toBeGreaterThan(0)
  })
})
