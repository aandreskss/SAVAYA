'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/domains/auth/auth'
import { insertManualRate } from './repository'
import type { AdminExchangeRate, ActionResult } from './types'

const REVALIDATE = '/admin/tasas'

const OverrideSchema = z.object({
  rateVes: z.number().positive('La tasa debe ser un número positivo'),
  reason: z
    .string()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(500, 'El motivo no puede superar 500 caracteres'),
})

export async function setManualRateAction(
  rateVes: number,
  reason: string,
): Promise<ActionResult<AdminExchangeRate>> {
  const session = await auth()
  await headers()

  if (!session?.user?.id) return { success: false, error: 'No autenticado' }

  const permissions = (session.user.permissions ?? []) as string[]
  if (!permissions.includes('exchange_rates:override')) {
    return { success: false, error: 'Solo super_admin puede fijar tasas manualmente' }
  }

  const parsed = OverrideSchema.safeParse({ rateVes, reason })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const rate = await insertManualRate({
      rateVes: parsed.data.rateVes,
      reason: parsed.data.reason,
      userId: session.user.id,
    })
    revalidatePath(REVALIDATE)
    return { success: true, data: rate }
  } catch {
    return { success: false, error: 'Error al guardar la tasa' }
  }
}
