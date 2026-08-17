'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import { ManualMovementSchema } from './validators'
import { applyManualMovement } from './repository'
import type { ManualMovementPayload, ActionResult } from './types'

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

export async function applyManualMovementAction(
  payload: ManualMovementPayload,
): Promise<ActionResult<void>> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('inventory:write')) {
    return { success: false, error: 'Sin permiso para modificar inventario' }
  }

  const parsed = ManualMovementSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await applyManualMovement(parsed.data, actor)
    revalidatePath('/admin/inventario')
    revalidatePath(`/admin/inventario/${parsed.data.variantId}`)
    return { success: true, data: undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al registrar movimiento'
    return { success: false, error: message }
  }
}
