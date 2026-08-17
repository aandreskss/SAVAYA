'use server'

import { cookies, headers } from 'next/headers'
import { CreateOrderSchema } from './validators'
import { createOrder } from './service'
import { getCheckoutSettings } from './repository'
import type { CreateOrderInput } from './validators'
import type { ActionResult } from '@/shared/lib/types'
import type { OrderResult } from './types'
import { checkRateLimit } from '@/shared/lib/rate-limit'

export async function submitOrder(
  input: CreateOrderInput,
): Promise<ActionResult<OrderResult>> {
  // Rate limit: 5 orders per hour per IP
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown'
  const rl = await checkRateLimit('orderCreate', ip)
  if (!rl.success) {
    return {
      success: false,
      error: 'Demasiados intentos. Espera un momento antes de intentar de nuevo.',
    }
  }

  // Validate client input with Zod
  const parsed = CreateOrderSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return {
      success: false,
      error: firstError?.message ?? 'Datos de checkout inválidos.',
    }
  }

  // Read cartId from HttpOnly cookie server-side (client cannot access it)
  const cookieStore = await cookies()
  const cartId = cookieStore.get('savaya-cart-id')?.value
  if (!cartId) {
    return { success: false, error: 'No se encontró tu carrito. Intenta de nuevo.' }
  }

  const { reservationExpiryHours } = await getCheckoutSettings()

  const result = await createOrder(
    { ...parsed.data, cartId },
    reservationExpiryHours,
  )

  return result
}
