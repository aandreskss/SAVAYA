'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/domains/auth/auth'
import { upsertSetting } from './repository'
import type { ActionResult, SizeGuideRow } from './types'

const REVALIDATE = '/admin/configuracion'

const Schema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(2000),
})

const SizeGuideRowSchema = z.object({
  ve: z.string().min(1).max(10),
  eu: z.string().min(1).max(10),
  cm: z.string().min(1).max(10),
})

const SizeGuideSchema = z.object({
  enabled: z.boolean(),
  rows: z.array(SizeGuideRowSchema).min(1).max(50),
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
    const shopLayoutKeys = ['store_instagram', 'store_tiktok', 'store_whatsapp', 'store_email', 'wa_button_enabled', 'wa_button_message']
    if (shopLayoutKeys.includes(parsed.data.key)) {
      revalidatePath('/', 'layout')
    }
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al guardar la configuración' }
  }
}

export async function updateSizeGuideAction(
  enabled: boolean,
  rows: SizeGuideRow[],
): Promise<ActionResult> {
  const session = await auth()
  await headers()

  if (!session?.user?.id) return { success: false, error: 'No autenticado' }

  const permissions = (session.user.permissions ?? []) as string[]
  if (!permissions.includes('settings:write')) {
    return { success: false, error: 'Sin permiso para editar la configuración' }
  }

  const parsed = SizeGuideSchema.safeParse({ enabled, rows })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await upsertSetting('size_guide_enabled', String(parsed.data.enabled), session.user.id)
    await upsertSetting('size_guide_rows', JSON.stringify(parsed.data.rows), session.user.id)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al guardar la guía de tallas' }
  }
}
