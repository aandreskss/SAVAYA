'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { setUserRoles, createAdminUser } from './repository'
import type { ActionResult, AdminUser } from './types'

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

// ---------------------------------------------------------------------------
// Create admin user
// ---------------------------------------------------------------------------

const CreateAdminUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().max(100).optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  roleIds: z.array(z.string().uuid()),
})

export async function createAdminUserAction(
  payload: unknown,
): Promise<ActionResult<AdminUser>> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('users:write')) {
    return { success: false, error: 'Sin permiso para crear usuarios' }
  }

  const parsed = CreateAdminUserSchema.safeParse(payload)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Datos inválidos' }
  }

  const { email, name, password, roleIds } = parsed.data
  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const newUser = await createAdminUser(
      email.toLowerCase().trim(),
      name?.trim() || null,
      passwordHash,
      roleIds,
      actor.id,
    )
    revalidatePath(REVALIDATE)
    return { success: true, data: newUser }
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      return { success: false, error: 'Este email ya está registrado' }
    }
    return { success: false, error: 'Error al crear el usuario' }
  }
}

// ---------------------------------------------------------------------------
// Update roles
// ---------------------------------------------------------------------------

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
