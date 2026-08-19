'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/domains/auth/auth'
import { refreshRate, refreshEurRate } from '@/domains/exchange-rates/service'
import { insertManualRate, setActiveDisplayRate } from './repository'
import type { AdminExchangeRate, ActionResult } from './types'

const REVALIDATE = '/admin/tasas'

const OverrideSchema = z.object({
  currency: z.enum(['usd', 'eur']),
  rateVes: z.number().positive('La tasa debe ser un número positivo'),
  reason: z
    .string()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(500, 'El motivo no puede superar 500 caracteres'),
})

export async function setManualRateAction(
  currency: 'usd' | 'eur',
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

  const parsed = OverrideSchema.safeParse({ currency, rateVes, reason })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const rate = await insertManualRate({
      currency: parsed.data.currency,
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

// ---------------------------------------------------------------------------
// Refresh rates from BCV API — available to any authenticated admin
// ---------------------------------------------------------------------------

type RefreshedRates = {
  usd: { rateVes: number; source: string; fetchedAt: Date }
  eur: { rateVes: number; source: string; fetchedAt: Date }
}

export async function refreshRatesAction(): Promise<ActionResult<RefreshedRates>> {
  const session = await auth()
  await headers()

  if (!session?.user?.id) return { success: false, error: 'No autenticado' }

  try {
    const [usd, eur] = await Promise.all([refreshRate(), refreshEurRate()])
    revalidatePath(REVALIDATE)
    return {
      success: true,
      data: {
        usd: { rateVes: usd.rateVes, source: usd.source, fetchedAt: usd.fetchedAt },
        eur: { rateVes: eur.rateVes, source: eur.source, fetchedAt: eur.fetchedAt },
      },
    }
  } catch {
    return { success: false, error: 'Error al consultar la API de BCV' }
  }
}

const DisplayRateSchema = z.object({ currency: z.enum(['usd', 'eur']) })

export async function setActiveDisplayRateAction(
  currency: 'usd' | 'eur',
): Promise<ActionResult<{ currency: 'usd' | 'eur' }>> {
  const session = await auth()
  await headers()

  if (!session?.user?.id) return { success: false, error: 'No autenticado' }

  const permissions = (session.user.permissions ?? []) as string[]
  if (!permissions.includes('exchange_rates:override')) {
    return { success: false, error: 'Sin permiso para cambiar la tasa activa' }
  }

  const parsed = DisplayRateSchema.safeParse({ currency })
  if (!parsed.success) return { success: false, error: 'Moneda inválida' }

  try {
    await setActiveDisplayRate(parsed.data.currency, session.user.id)
    revalidatePath(REVALIDATE)
    revalidatePath('/carrito')
    return { success: true, data: { currency: parsed.data.currency } }
  } catch {
    return { success: false, error: 'Error al guardar la configuración' }
  }
}
