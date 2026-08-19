'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/domains/auth/auth'
import {
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  togglePaymentMethod,
  deletePaymentMethod,
} from './repository'
import type { AdminPaymentMethod, PaymentMethodType, ActionResult } from './types'

const REVALIDATE = '/admin/metodos-pago'

async function requireSettingsWrite(): Promise<{ error: string } | { userId: string }> {
  const session = await auth()
  await headers()
  if (!session?.user?.id) return { error: 'No autenticado' }
  const permissions = (session.user.permissions ?? []) as string[]
  if (!permissions.includes('settings:write')) return { error: 'Sin permiso (settings:write)' }
  return { userId: session.user.id }
}

// ---------------------------------------------------------------------------
// Account details validation per type
// ---------------------------------------------------------------------------

const ZELLE_SCHEMA = z.object({
  email: z.string().email('Email inválido'),
  holderName: z.string().min(1, 'Titular requerido'),
})

const PAGO_MOVIL_SCHEMA = z.object({
  phone: z.string().min(10, 'Teléfono inválido'),
  cedula: z.string().min(5, 'Cédula inválida'),
  bank: z.string().min(2, 'Banco requerido'),
  accountHolder: z.string().min(1, 'Titular requerido'),
})

const BANK_TRANSFER_SCHEMA = z.object({
  bank: z.string().min(2, 'Banco requerido'),
  accountNumber: z.string().min(10, 'Número de cuenta inválido'),
  accountHolder: z.string().min(1, 'Titular requerido'),
  accountType: z.enum(['corriente', 'ahorro']),
  rif: z.string().min(8, 'RIF inválido'),
})

const USDT_SCHEMA = z.object({
  walletAddress: z.string().min(20, 'Dirección wallet inválida'),
})

const BINANCE_SCHEMA = z.object({
  binanceId: z.string().min(1, 'Binance ID requerido'),
  qrUrl: z
    .string()
    .url('URL de QR inválida')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
})

function parseAccountDetails(
  type: PaymentMethodType,
  raw: unknown,
): { data: Record<string, unknown> } | { error: string } {
  if (type === 'cash') return { data: {} }

  const schemas: Partial<Record<PaymentMethodType, z.ZodTypeAny>> = {
    zelle: ZELLE_SCHEMA,
    pago_movil: PAGO_MOVIL_SCHEMA,
    bank_transfer: BANK_TRANSFER_SCHEMA,
    usdt_trc20: USDT_SCHEMA,
    binance_pay: BINANCE_SCHEMA,
  }

  const schema = schemas[type]
  if (!schema) return { data: {} }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Datos de cuenta inválidos' }
  }
  return { data: result.data as Record<string, unknown> }
}

// ---------------------------------------------------------------------------
// Base form schema
// ---------------------------------------------------------------------------

const BaseSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100),
  type: z.enum(['zelle', 'pago_movil', 'bank_transfer', 'usdt_trc20', 'binance_pay', 'cash']),
  currency: z.enum(['usd', 'ves']),
  instructions: z.string().max(1000).optional().nullable(),
  accountDetails: z.record(z.string(), z.unknown()).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
})

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function createPaymentMethodAction(
  formData: z.infer<typeof BaseSchema>,
): Promise<ActionResult<AdminPaymentMethod>> {
  const auth = await requireSettingsWrite()
  if ('error' in auth) return { success: false, error: auth.error }

  const parsed = BaseSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const detailsResult = parseAccountDetails(parsed.data.type, parsed.data.accountDetails)
  if ('error' in detailsResult) return { success: false, error: detailsResult.error }

  try {
    const method = await createPaymentMethod({
      name: parsed.data.name,
      type: parsed.data.type,
      currency: parsed.data.currency,
      instructions: parsed.data.instructions ?? null,
      accountDetails: detailsResult.data,
      sortOrder: parsed.data.sortOrder,
    })
    revalidatePath(REVALIDATE)
    revalidatePath('/checkout')
    return { success: true, data: method }
  } catch {
    return { success: false, error: 'Error al crear el método de pago' }
  }
}

export async function updatePaymentMethodAction(
  id: string,
  formData: Omit<z.infer<typeof BaseSchema>, 'type'>,
): Promise<ActionResult<AdminPaymentMethod>> {
  const auth = await requireSettingsWrite()
  if ('error' in auth) return { success: false, error: auth.error }

  if (!id) return { success: false, error: 'ID requerido' }

  const UpdateSchema = BaseSchema.omit({ type: true })
  const parsed = UpdateSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    const method = await updatePaymentMethod(id, {
      name: parsed.data.name,
      currency: parsed.data.currency,
      instructions: parsed.data.instructions ?? null,
      accountDetails: (parsed.data.accountDetails as Record<string, unknown>) ?? null,
      sortOrder: parsed.data.sortOrder,
    })
    revalidatePath(REVALIDATE)
    revalidatePath('/checkout')
    return { success: true, data: method }
  } catch {
    return { success: false, error: 'Error al actualizar el método de pago' }
  }
}

export async function togglePaymentMethodAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const auth = await requireSettingsWrite()
  if ('error' in auth) return { success: false, error: auth.error }

  try {
    await togglePaymentMethod(id, isActive)
    revalidatePath(REVALIDATE)
    revalidatePath('/checkout')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar el estado' }
  }
}

export async function deletePaymentMethodAction(id: string): Promise<ActionResult> {
  const auth = await requireSettingsWrite()
  if ('error' in auth) return { success: false, error: auth.error }

  try {
    await deletePaymentMethod(id)
    revalidatePath(REVALIDATE)
    revalidatePath('/checkout')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al eliminar el método de pago' }
  }
}
