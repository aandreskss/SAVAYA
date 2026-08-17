import { describe, it, expect } from 'vitest'
import { ROLE_PERMISSIONS, PERMISSIONS } from '@/domains/roles-permissions/permissions'
import { isValidTransition } from '@/domains/orders/state-machine'

// ---------------------------------------------------------------------------
// Role permissions
// ---------------------------------------------------------------------------

describe('ROLE_PERMISSIONS', () => {
  it('el rol catalog NO tiene el permiso payments:approve', () => {
    const catalogPerms = ROLE_PERMISSIONS['catalog']
    expect(catalogPerms).not.toContain(PERMISSIONS.PAYMENTS_APPROVE)
  })

  it('el rol super_admin tiene TODOS los permisos', () => {
    const allPerms = Object.values(PERMISSIONS)
    const superAdminPerms = ROLE_PERMISSIONS['super_admin']
    for (const perm of allPerms) {
      expect(superAdminPerms).toContain(perm)
    }
  })

  it('el rol admin NO tiene exchange_rates:override (acción de alto riesgo reservada para super_admin)', () => {
    const adminPerms = ROLE_PERMISSIONS['admin']
    expect(adminPerms).not.toContain(PERMISSIONS.EXCHANGE_RATES_OVERRIDE)
  })

  it('el rol finance puede aprobar pagos', () => {
    const financePerms = ROLE_PERMISSIONS['finance']
    expect(financePerms).toContain(PERMISSIONS.PAYMENTS_APPROVE)
    expect(financePerms).toContain(PERMISSIONS.PAYMENTS_REJECT)
  })
})

// ---------------------------------------------------------------------------
// Order state machine
// ---------------------------------------------------------------------------

describe('isValidTransition', () => {
  it('PAID → PENDING_PAYMENT retorna false (no se puede revertir un pago)', () => {
    expect(isValidTransition('paid', 'pending_payment')).toBe(false)
  })

  it('PENDING_PAYMENT → PAYMENT_UNDER_REVIEW retorna true', () => {
    expect(isValidTransition('pending_payment', 'payment_under_review')).toBe(true)
  })

  it('PENDING_PAYMENT → CANCELLED retorna true', () => {
    expect(isValidTransition('pending_payment', 'cancelled')).toBe(true)
  })

  it('DELIVERED → cualquier estado retorna false (estado terminal)', () => {
    expect(isValidTransition('delivered', 'shipped')).toBe(false)
    expect(isValidTransition('delivered', 'pending_payment')).toBe(false)
    expect(isValidTransition('delivered', 'refunded')).toBe(false)
  })

  it('PAYMENT_UNDER_REVIEW → PAID retorna true (pago aprobado)', () => {
    expect(isValidTransition('payment_under_review', 'paid')).toBe(true)
  })

  it('PAYMENT_UNDER_REVIEW → PAYMENT_REJECTED retorna true', () => {
    expect(isValidTransition('payment_under_review', 'payment_rejected')).toBe(true)
  })
})
