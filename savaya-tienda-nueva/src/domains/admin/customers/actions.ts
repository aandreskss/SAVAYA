'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import { AddNoteSchema, SetTagSchema, UpdateCustomerSchema } from './validators'
import { addCustomerNote, setCustomerTag, updateAdminCustomer, setCustomerStatus, deleteAdminCustomer } from './repository'
import type { AddNotePayload, SetTagPayload, UpdateCustomerPayload } from './validators'
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

export async function updateCustomerAction(
  payload: UpdateCustomerPayload,
): Promise<ActionResult<{ firstName: string; lastName: string; email: string; phone: string | null; whatsapp: string | null }>> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('customers:write')) {
    return { success: false, error: 'Sin permiso para editar clientes' }
  }

  const parsed = UpdateCustomerSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await updateAdminCustomer(parsed.data.customerId, parsed.data, actor)
    revalidatePath(`/admin/clientes/${parsed.data.customerId}`)
    revalidatePath('/admin/clientes')
    return {
      success: true,
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email.toLowerCase().trim(),
        phone: parsed.data.phone,
        whatsapp: parsed.data.whatsapp,
      },
    }
  } catch {
    return { success: false, error: 'Error al actualizar los datos' }
  }
}

export async function setCustomerStatusAction(
  customerId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('customers:write')) {
    return { success: false, error: 'Sin permiso para modificar clientes' }
  }

  try {
    await setCustomerStatus(customerId, isActive, actor)
    revalidatePath(`/admin/clientes/${customerId}`)
    revalidatePath('/admin/clientes')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar el estado' }
  }
}

export async function deleteCustomerAction(
  customerId: string,
): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('customers:write')) {
    return { success: false, error: 'Sin permiso para eliminar clientes' }
  }

  try {
    await deleteAdminCustomer(customerId, actor)
    revalidatePath('/admin/clientes')
    return { success: true, data: undefined }
  } catch (err) {
    if (err instanceof Error && err.message.includes('violates foreign key constraint')) {
      return { success: false, error: 'No se puede eliminar un cliente con pedidos. Puedes bloquearlo en su lugar.' }
    }
    return { success: false, error: 'Error al eliminar el cliente' }
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
