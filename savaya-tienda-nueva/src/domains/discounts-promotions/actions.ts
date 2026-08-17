'use server'

import { ValidateCouponSchema } from './validators'
import { validateCoupon } from './service'
import type { CouponValidationResult } from './types'

// ---------------------------------------------------------------------------
// validateCouponAction — storefront: called from cart page
// No auth required — guests can also apply coupons
// ---------------------------------------------------------------------------

export async function validateCouponAction(
  code: string,
  subtotalUsd: number,
  customerId?: string,
): Promise<CouponValidationResult> {
  if (!process.env.DATABASE_URL) {
    // Dev fallback
    if (code.toUpperCase() === 'SAVAYA10') {
      return {
        valid: true,
        discountId: 'mock-id',
        discountAmount: subtotalUsd * 0.1,
        type: 'percentage',
        value: 10,
        appliesToType: 'all',
        message: '¡Código aplicado! 10% de descuento',
      }
    }
    return { valid: false, error: 'Código no válido (modo dev).' }
  }

  const parsed = ValidateCouponSchema.safeParse({ code, subtotalUsd, customerId })
  if (!parsed.success) {
    return { valid: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  return validateCoupon(
    parsed.data.code,
    parsed.data.subtotalUsd,
    parsed.data.customerId,
  )
}
