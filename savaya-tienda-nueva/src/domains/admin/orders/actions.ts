'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import {
  ApprovePaymentSchema,
  RejectPaymentSchema,
  TransitionOrderSchema,
} from './validators'
import {
  approvePayment,
  rejectPayment,
  transitionOrderStatus,
  OrderTransitionError,
} from './service'
import { deleteOrder } from './repository'
import type {
  ApprovePaymentPayload,
  RejectPaymentPayload,
  TransitionOrderPayload,
} from './validators'
import type { ActionResult } from './types'

async function getActorContext() {
  const session = await auth()
  if (!session?.user?.id) return null

  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown'

  return {
    actorId: session.user.id,
    actorEmail: session.user.email ?? '',
    ip,
    permissions: (session.user.permissions ?? []) as string[],
  }
}

export async function approvePaymentAction(
  payload: ApprovePaymentPayload,
): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('payments:approve')) {
    return { success: false, error: 'Sin permiso para aprobar pagos' }
  }

  const parsed = ApprovePaymentSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await approvePayment(parsed.data.proofId, parsed.data.orderId, actor)
    revalidatePath('/admin/pagos')
    revalidatePath('/admin/pedidos')
    if (parsed.data.orderNumber) {
      revalidatePath(`/admin/pedidos/${parsed.data.orderNumber}`)
    }
    return { success: true, data: undefined }
  } catch (err) {
    const message =
      err instanceof OrderTransitionError
        ? err.message
        : 'Error al aprobar el pago'
    return { success: false, error: message }
  }
}

export async function rejectPaymentAction(
  payload: RejectPaymentPayload,
): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('payments:reject')) {
    return { success: false, error: 'Sin permiso para rechazar pagos' }
  }

  const parsed = RejectPaymentSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await rejectPayment(parsed.data.proofId, parsed.data.orderId, parsed.data.reason, actor)
    revalidatePath('/admin/pagos')
    revalidatePath('/admin/pedidos')
    if (parsed.data.orderNumber) {
      revalidatePath(`/admin/pedidos/${parsed.data.orderNumber}`)
    }
    return { success: true, data: undefined }
  } catch (err) {
    const message =
      err instanceof OrderTransitionError
        ? err.message
        : 'Error al rechazar el pago'
    return { success: false, error: message }
  }
}

export async function transitionOrderStatusAction(
  payload: TransitionOrderPayload,
): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('orders:write')) {
    return { success: false, error: 'Sin permiso para actualizar pedidos' }
  }

  const parsed = TransitionOrderSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await transitionOrderStatus(
      parsed.data.orderId,
      parsed.data.toStatus,
      actor,
      parsed.data.reason,
    )
    revalidatePath('/admin/pedidos')
    if (parsed.data.orderNumber) {
      revalidatePath(`/admin/pedidos/${parsed.data.orderNumber}`)
    }
    return { success: true, data: undefined }
  } catch (err) {
    const message =
      err instanceof OrderTransitionError
        ? err.message
        : 'Error al actualizar el estado del pedido'
    return { success: false, error: message }
  }
}

export async function deleteOrderAction(orderId: string): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('orders:write')) {
    return { success: false, error: 'Sin permiso para eliminar pedidos' }
  }

  try {
    await deleteOrder(orderId, actor.actorId, actor.actorEmail, actor.ip)
    revalidatePath('/admin/pedidos')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar el pedido' }
  }
}
