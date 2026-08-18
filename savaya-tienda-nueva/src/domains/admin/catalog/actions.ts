'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { auth } from '@/domains/auth/auth'
import { SaveProductSchema, SaveCategorySchema, SaveCollectionSchema } from './validators'
import {
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  publishProduct,
  unpublishProduct,
  duplicateProduct,
  deleteMediaRecord,
  createCategory,
  updateCategory,
  deleteCategory,
  createCollection,
  updateCollection,
  deleteCollection,
  setCollectionProducts,
  searchProductsForCollection,
  type CollectionProductSummary,
} from './repository'
import type { SaveProductPayload, SaveCategoryPayload, SaveCollectionPayload, ActionResult } from './types'

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

function hasPermission(permissions: string[], slug: string): boolean {
  return permissions.includes(slug)
}

// ---------------------------------------------------------------------------
// Product actions
// ---------------------------------------------------------------------------

export async function saveProductAction(
  payload: SaveProductPayload,
): Promise<ActionResult<{ id: string }>> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso para editar productos' }
  }

  const parsed = SaveProductSchema.safeParse(payload)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { success: false, error: first?.message ?? 'Datos inválidos' }
  }

  const data = parsed.data

  try {
    if (data.id) {
      await updateProduct(data.id, data as SaveProductPayload, actor.actorId, actor.actorEmail, actor.ip)
      revalidatePath('/admin/productos')
      revalidatePath(`/admin/productos/${data.id}`)
      revalidatePath(`/producto/${data.slug}`)
      revalidatePath('/categoria', 'layout')
      return { success: true, data: { id: data.id } }
    } else {
      const id = await createProduct(data as SaveProductPayload, actor.actorId, actor.actorEmail, actor.ip)
      revalidatePath('/admin/productos')
      revalidatePath(`/producto/${data.slug}`)
      revalidatePath('/categoria', 'layout')
      return { success: true, data: { id } }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al guardar el producto'
    return { success: false, error: message }
  }
}

export async function archiveProductAction(id: string): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso' }
  }

  try {
    await archiveProduct(id, actor.actorId, actor.actorEmail, actor.ip)
    revalidatePath('/admin/productos')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al archivar' }
  }
}

export async function restoreProductAction(id: string): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso' }
  }

  try {
    await restoreProduct(id, actor.actorId, actor.actorEmail, actor.ip)
    revalidatePath('/admin/productos')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al restaurar' }
  }
}

export async function publishProductAction(id: string): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso' }
  }

  try {
    await publishProduct(id, actor.actorId, actor.actorEmail, actor.ip)
    revalidatePath('/admin/productos')
    revalidatePath('/categoria', 'layout')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al publicar' }
  }
}

export async function unpublishProductAction(id: string): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso' }
  }

  try {
    await unpublishProduct(id, actor.actorId, actor.actorEmail, actor.ip)
    revalidatePath('/admin/productos')
    revalidatePath('/categoria', 'layout')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al despublicar' }
  }
}

export async function duplicateProductAction(id: string): Promise<ActionResult<{ id: string }>> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso' }
  }

  try {
    const newId = await duplicateProduct(id, actor.actorId, actor.actorEmail, actor.ip)
    revalidatePath('/admin/productos')
    return { success: true, data: { id: newId } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al duplicar' }
  }
}

export async function deleteProductMediaAction(mediaId: string): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso' }
  }

  try {
    const cloudinaryPublicId = await deleteMediaRecord(mediaId)

    // Attempt Cloudinary destroy (non-blocking — don't fail the action if this fails)
    if (cloudinaryPublicId) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET

      if (cloudName && apiKey && apiSecret) {
        const timestamp = Math.floor(Date.now() / 1000)
        const signature = crypto
          .createHash('sha1')
          .update(`public_id=${cloudinaryPublicId}&timestamp=${timestamp}${apiSecret}`)
          .digest('hex')

        await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              public_id: cloudinaryPublicId,
              timestamp: String(timestamp),
              api_key: apiKey,
              signature,
            }),
          },
        ).catch(() => {/* non-critical */})
      }
    }

    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar imagen' }
  }
}

// ---------------------------------------------------------------------------
// Category actions
// ---------------------------------------------------------------------------

export async function saveCategoryAction(
  payload: SaveCategoryPayload,
): Promise<ActionResult<{ id: string }>> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso para editar categorías' }
  }

  const parsed = SaveCategorySchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const data = parsed.data

  try {
    if (data.id) {
      await updateCategory(data.id, data as SaveCategoryPayload, actor.actorId, actor.actorEmail, actor.ip)
      revalidatePath('/admin/productos/categorias')
      revalidatePath('/categoria', 'layout')
      return { success: true, data: { id: data.id } }
    } else {
      const id = await createCategory(data as SaveCategoryPayload, actor.actorId, actor.actorEmail, actor.ip)
      revalidatePath('/admin/productos/categorias')
      revalidatePath('/categoria', 'layout')
      return { success: true, data: { id } }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al guardar categoría' }
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:delete')) {
    return { success: false, error: 'Sin permiso para eliminar categorías' }
  }

  try {
    await deleteCategory(id, actor.actorId, actor.actorEmail, actor.ip)
    revalidatePath('/admin/productos/categorias')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar categoría' }
  }
}

// ---------------------------------------------------------------------------
// Collection actions
// ---------------------------------------------------------------------------

export async function saveCollectionAction(
  payload: SaveCollectionPayload,
): Promise<ActionResult<{ id: string }>> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso para editar colecciones' }
  }

  const parsed = SaveCollectionSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const data = parsed.data

  try {
    if (data.id) {
      await updateCollection(data.id, data as SaveCollectionPayload, actor.actorId, actor.actorEmail, actor.ip)
      revalidatePath('/admin/productos/colecciones')
      return { success: true, data: { id: data.id } }
    } else {
      const id = await createCollection(data as SaveCollectionPayload, actor.actorId, actor.actorEmail, actor.ip)
      revalidatePath('/admin/productos/colecciones')
      return { success: true, data: { id } }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al guardar colección' }
  }
}

export async function deleteCollectionAction(id: string): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:delete')) {
    return { success: false, error: 'Sin permiso para eliminar colecciones' }
  }

  try {
    await deleteCollection(id, actor.actorId, actor.actorEmail, actor.ip)
    revalidatePath('/admin/productos/colecciones')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al eliminar colección' }
  }
}

export async function setCollectionProductsAction(
  collectionId: string,
  productIds: string[],
): Promise<ActionResult> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }
  if (!hasPermission(actor.permissions, 'catalog:write')) {
    return { success: false, error: 'Sin permiso para editar colecciones' }
  }

  try {
    await setCollectionProducts(collectionId, productIds, actor.actorId, actor.actorEmail, actor.ip)
    revalidatePath('/admin/productos/colecciones')
    revalidatePath(`/coleccion/${collectionId}`, 'page')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al guardar productos' }
  }
}

export async function searchProductsForCollectionAction(
  query: string,
): Promise<ActionResult<CollectionProductSummary[]>> {
  const actor = await getActorContext()
  if (!actor) return { success: false, error: 'No autenticado' }

  try {
    const results = await searchProductsForCollection(query)
    return { success: true, data: results }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error al buscar productos' }
  }
}
