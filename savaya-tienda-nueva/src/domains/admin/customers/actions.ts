'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import { AddNoteSchema, SetTagSchema } from './validators'
import { addCustomerNote, setCustomerTag } from './repository'
import type { AddNotePayload, SetTagPayload } from './validators'
import type { ActionResult, CustomerNote } from './types'

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

export async function addCustomerNoteAction(
  payload: AddNotePayload,
): Promise<ActionResult<CustomerNote>> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('customers:write')) {
    return { success: false, error: 'Sin permiso para agregar notas' }
  }

  const parsed = AddNoteSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const note = await addCustomerNote(parsed.data.customerId, parsed.data.content, actor)
    revalidatePath(`/admin/clientes/${parsed.data.customerId}`)
    return { success: true, data: note }
  } catch {
    return { success: false, error: 'Error al guardar la nota' }
  }
}

export async function setCustomerTagAction(
  payload: SetTagPayload,
): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('customers:write')) {
    return { success: false, error: 'Sin permiso para modificar etiquetas' }
  }

  const parsed = SetTagSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await setCustomerTag(
      parsed.data.customerId,
      parsed.data.tag,
      parsed.data.active,
      actor,
    )
    revalidatePath(`/admin/clientes/${parsed.data.customerId}`)
    revalidatePath('/admin/clientes')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar la etiqueta' }
  }
}
