'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/domains/auth/auth'
import { upsertSetting } from './repository'
import type { ActionResult } from './types'

const REVALIDATE = '/admin/configuracion'

const Schema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(2000),
})

export async function updateSettingAction(
  key: string,
  value: string,
): Promise<ActionResult> {
  const session = await auth()
  await headers()

  if (!session?.user?.id) return { success: false, error: 'No autenticado' }

  const permissions = (session.user.permissions ?? []) as string[]
  if (!permissions.includes('settings:write')) {
    return { success: false, error: 'Sin permiso para editar la configuración' }
  }

  const parsed = Schema.safeParse({ key, value })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await upsertSetting(parsed.data.key, parsed.data.value.trim(), session.user.id)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al guardar la configuración' }
  }
}
