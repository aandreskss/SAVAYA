'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import { setUserRoles } from './repository'
import type { ActionResult } from './types'

const REVALIDATE = '/admin/usuarios'

async function getActor() {
  const session = await auth()
  if (!session?.user?.id) return null
  await headers()
  return {
    id: session.user.id,
    permissions: (session.user.permissions ?? []) as string[],
  }
}

export async function setUserRolesAction(
  targetUserId: string,
  newRoleIds: string[],
): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('users:write')) {
    return { success: false, error: 'Sin permiso para gestionar usuarios' }
  }
  if (actor.id === targetUserId) {
    return { success: false, error: 'No puedes modificar tus propios roles' }
  }

  try {
    await setUserRoles(targetUserId, newRoleIds, actor.id)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar los roles' }
  }
}
