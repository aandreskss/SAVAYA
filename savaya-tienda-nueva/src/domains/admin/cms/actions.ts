'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import { BLOCK_SCHEMAS } from '@/domains/cms/block-schemas'
import type { BlockType } from '@/domains/cms/block-schemas'
import {
  updateSectionContent,
  updateSectionsOrder,
  toggleSectionActive,
  createSection,
  deleteSection,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  createAdminPopup,
  updateAdminPopup,
  deleteAdminPopup,
} from './repository'
import {
  ReorderSectionsSchema,
  ToggleSectionSchema,
  UpdateSectionContentSchema,
  CreateSectionSchema,
  DeleteSectionSchema,
  BannerFormSchema,
  PopupFormSchema,
  type BannerFormPayload,
  type PopupFormPayload,
} from './validators'
import type { ActionResult, AdminBanner, AdminPopup, AdminSection } from './types'

async function getActor() {
  const session = await auth()
  if (!session?.user?.id) return null
  await headers() // required for dynamic rendering
  return {
    id: session.user.id,
    permissions: (session.user.permissions ?? []) as string[],
  }
}

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function updateSectionContentAction(payload: {
  sectionId: string
  type: string
  content: Record<string, unknown>
}): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso para editar contenido' }
  }

  const parsed = UpdateSectionContentSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const schema = BLOCK_SCHEMAS[parsed.data.type as BlockType]
  if (!schema) {
    return { success: false, error: 'Este tipo de bloque no es editable directamente' }
  }

  const validated = schema.safeParse(parsed.data.content)
  if (!validated.success) {
    const issue = validated.error.issues[0]
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    return { success: false, error: `${path}${issue.message}` }
  }

  try {
    await updateSectionContent(parsed.data.sectionId, validated.data)
    revalidatePath('/')
    revalidatePath('/admin/contenido')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al guardar el bloque' }
  }
}

export async function reorderSectionsAction(payload: {
  items: { id: string; sortOrder: number }[]
}): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso' }
  }

  const parsed = ReorderSectionsSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await updateSectionsOrder(parsed.data.items)
    revalidatePath('/')
    revalidatePath('/admin/contenido')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al reordenar los bloques' }
  }
}

export async function toggleSectionActiveAction(payload: {
  sectionId: string
  isActive: boolean
}): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso' }
  }

  const parsed = ToggleSectionSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await toggleSectionActive(parsed.data.sectionId, parsed.data.isActive)
    revalidatePath('/')
    revalidatePath('/admin/contenido')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar el bloque' }
  }
}

export async function createSectionAction(payload: {
  pageSlug: string
  type: string
  currentMaxSortOrder: number
}): Promise<ActionResult<AdminSection>> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso para agregar bloques' }
  }

  const parsed = CreateSectionSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const schema = BLOCK_SCHEMAS[parsed.data.type as BlockType]
  if (!schema) {
    return { success: false, error: 'Tipo de bloque no reconocido' }
  }

  const defaultContent = schema.parse({})

  try {
    const section = await createSection(
      parsed.data.pageSlug,
      parsed.data.type,
      defaultContent,
      payload.currentMaxSortOrder + 1,
    )
    revalidatePath('/')
    revalidatePath('/admin/contenido')
    return { success: true, data: section as AdminSection }
  } catch {
    return { success: false, error: 'Error al crear el bloque' }
  }
}

export async function deleteSectionAction(payload: {
  sectionId: string
}): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso para eliminar bloques' }
  }

  const parsed = DeleteSectionSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await deleteSection(parsed.data.sectionId)
    revalidatePath('/')
    revalidatePath('/admin/contenido')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al eliminar el bloque' }
  }
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export async function createBannerAction(
  payload: BannerFormPayload,
): Promise<ActionResult<AdminBanner>> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso para crear banners' }
  }

  const parsed = BannerFormSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const banner = await createAdminBanner({
      title: parsed.data.title,
      imageDesktopUrl: parsed.data.imageDesktopUrl,
      imageMobileUrl: parsed.data.imageMobileUrl,
      ctaText: parsed.data.ctaText ?? null,
      ctaUrl: parsed.data.ctaUrl ?? null,
      isActive: parsed.data.isActive,
      startsAt: parseDate(parsed.data.startsAt),
      endsAt: parseDate(parsed.data.endsAt),
      sortOrder: parsed.data.sortOrder,
    })
    revalidatePath('/')
    revalidatePath('/admin/contenido')
    return { success: true, data: banner }
  } catch {
    return { success: false, error: 'Error al crear el banner' }
  }
}

export async function updateBannerAction(
  id: string,
  payload: BannerFormPayload,
): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso para editar banners' }
  }

  const parsed = BannerFormSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await updateAdminBanner(id, {
      title: parsed.data.title,
      imageDesktopUrl: parsed.data.imageDesktopUrl,
      imageMobileUrl: parsed.data.imageMobileUrl,
      ctaText: parsed.data.ctaText ?? null,
      ctaUrl: parsed.data.ctaUrl ?? null,
      isActive: parsed.data.isActive,
      startsAt: parseDate(parsed.data.startsAt),
      endsAt: parseDate(parsed.data.endsAt),
      sortOrder: parsed.data.sortOrder,
    })
    revalidatePath('/')
    revalidatePath('/admin/contenido')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar el banner' }
  }
}

export async function deleteBannerAction(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso para eliminar banners' }
  }

  try {
    await deleteAdminBanner(id)
    revalidatePath('/')
    revalidatePath('/admin/contenido')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al eliminar el banner' }
  }
}

// ---------------------------------------------------------------------------
// Popups
// ---------------------------------------------------------------------------

export async function createPopupAction(
  payload: PopupFormPayload,
): Promise<ActionResult<AdminPopup>> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso para crear popups' }
  }

  const parsed = PopupFormSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const showOnPages = parsed.data.showOnPagesRaw
    ? parsed.data.showOnPagesRaw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : null

  try {
    const popup = await createAdminPopup({
      title: parsed.data.title,
      imageUrl: parsed.data.imageUrl,
      ctaText: parsed.data.ctaText ?? null,
      ctaUrl: parsed.data.ctaUrl ?? null,
      delaySeconds: parsed.data.delaySeconds,
      showOnPages: showOnPages && showOnPages.length > 0 ? showOnPages : null,
      maxShowsPerSession: parsed.data.maxShowsPerSession,
      isActive: parsed.data.isActive,
      startsAt: parseDate(parsed.data.startsAt),
      endsAt: parseDate(parsed.data.endsAt),
    })
    revalidatePath('/admin/contenido')
    return { success: true, data: popup }
  } catch {
    return { success: false, error: 'Error al crear el popup' }
  }
}

export async function updatePopupAction(
  id: string,
  payload: PopupFormPayload,
): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso para editar popups' }
  }

  const parsed = PopupFormSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const showOnPages = parsed.data.showOnPagesRaw
    ? parsed.data.showOnPagesRaw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : null

  try {
    await updateAdminPopup(id, {
      title: parsed.data.title,
      imageUrl: parsed.data.imageUrl,
      ctaText: parsed.data.ctaText ?? null,
      ctaUrl: parsed.data.ctaUrl ?? null,
      delaySeconds: parsed.data.delaySeconds,
      showOnPages: showOnPages && showOnPages.length > 0 ? showOnPages : null,
      maxShowsPerSession: parsed.data.maxShowsPerSession,
      isActive: parsed.data.isActive,
      startsAt: parseDate(parsed.data.startsAt),
      endsAt: parseDate(parsed.data.endsAt),
    })
    revalidatePath('/admin/contenido')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar el popup' }
  }
}

export async function deletePopupAction(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!actor.permissions.includes('cms:write')) {
    return { success: false, error: 'Sin permiso para eliminar popups' }
  }

  try {
    await deleteAdminPopup(id)
    revalidatePath('/admin/contenido')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al eliminar el popup' }
  }
}
