import {
  findDiscountByCode,
  countCustomerUsages,
  customerHasOrders,
} from './repository'
import type { CouponValidationResult } from './types'

// ---------------------------------------------------------------------------
// validateCoupon — called from server action and inside createOrder
// ---------------------------------------------------------------------------

export async function validateCoupon(
  code: string,
  subtotalUsd: number,
  customerId?: string,
): Promise<CouponValidationResult> {
  const discount = await findDiscountByCode(code)

  if (!discount) {
    return { valid: false, error: 'El código de descuento no existe.' }
  }

  if (!discount.isActive) {
    return { valid: false, error: 'Este código no está activo.' }
  }

  const now = new Date()

  if (discount.startsAt && discount.startsAt > now) {
    return { valid: false, error: 'Este código aún no está vigente.' }
  }

  if (discount.endsAt && discount.endsAt < now) {
    return { valid: false, error: 'Este código ha expirado.' }
  }

  if (
    discount.maxUsesTotal != null &&
    discount.usedCount >= discount.maxUsesTotal
  ) {
    return { valid: false, error: 'Este código ha alcanzado el límite de usos.' }
  }

  if (discount.minOrderUsd != null && subtotalUsd < discount.minOrderUsd) {
    return {
      valid: false,
      error: `El pedido mínimo para este código es $${discount.minOrderUsd.toFixed(2)} USD.`,
    }
  }

  if (customerId) {
    if (
      discount.maxUsesPerCustomer > 0
    ) {
      const usages = await countCustomerUsages(discount.id, customerId)
      if (usages >= discount.maxUsesPerCustomer) {
        return {
          valid: false,
          error: 'Ya utilizaste este código el máximo de veces permitido.',
        }
      }
    }

    if (discount.isFirstOrderOnly) {
      const hasOrders = await customerHasOrders(customerId)
      if (hasOrders) {
        return {
          valid: false,
          error: 'Este código es exclusivo para el primer pedido.',
        }
      }
    }
  }

  const discountAmount = calculateDiscount(discount.type, discount.value, subtotalUsd)

  const label =
    discount.type === 'percentage'
      ? `${discount.value}% de descuento`
      : `$${discount.value.toFixed(2)} USD de descuento`

  return {
    valid: true,
    discountId: discount.id,
    discountAmount,
    type: discount.type,
    value: discount.value,
    appliesToType: discount.appliesToType,
    message: `¡Código aplicado! ${label}`,
  }
}

// ---------------------------------------------------------------------------
// calculateDiscount — pure, used both in service and in createOrder
// ---------------------------------------------------------------------------

export function calculateDiscount(
  type: 'percentage' | 'fixed_usd',
  value: number,
  subtotalUsd: number,
): number {
  if (type === 'percentage') {
    return Math.min(subtotalUsd * (value / 100), subtotalUsd)
  }
  return Math.min(value, subtotalUsd)
}
