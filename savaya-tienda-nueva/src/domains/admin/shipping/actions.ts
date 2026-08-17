'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import {
  createZone,
  updateZone,
  toggleZoneActive,
  deleteZone,
  createCity,
  deleteCity,
  createMethod,
  updateMethod,
  toggleMethodActive,
  deleteMethod,
  createRate,
  updateRate,
  deleteRate,
} from '@/domains/shipping/repository'
import {
  ZoneFormSchema,
  CityFormSchema,
  MethodFormSchema,
  RateFormSchema,
} from '@/domains/shipping/validators'
import type {
  ZoneFormPayload,
  CityFormPayload,
  MethodFormPayload,
  RateFormPayload,
} from '@/domains/shipping/validators'
import type {
  AdminShippingZone,
  AdminShippingCity,
  AdminShippingMethod,
  AdminShippingRate,
} from '@/domains/shipping/types'

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

const REVALIDATE = '/admin/delivery'

async function getActor() {
  const session = await auth()
  if (!session?.user?.id) return null
  await headers()
  return {
    id: session.user.id,
    permissions: (session.user.permissions ?? []) as string[],
  }
}

function noAuth<T = undefined>(): ActionResult<T> {
  return { success: false, error: 'No autenticado' }
}

function noPerm<T = undefined>(): ActionResult<T> {
  return { success: false, error: 'Sin permiso para editar configuración de envíos' }
}

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

export async function createZoneAction(
  payload: ZoneFormPayload,
): Promise<ActionResult<AdminShippingZone>> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  const parsed = ZoneFormSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    const zone = await createZone(parsed.data)
    revalidatePath(REVALIDATE)
    return { success: true, data: zone }
  } catch {
    return { success: false, error: 'Error al crear la zona' }
  }
}

export async function updateZoneAction(
  id: string,
  payload: ZoneFormPayload,
): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  const parsed = ZoneFormSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    await updateZone(id, parsed.data)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar la zona' }
  }
}

export async function toggleZoneActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  try {
    await toggleZoneActive(id, isActive)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al cambiar estado de la zona' }
  }
}

export async function deleteZoneAction(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  try {
    await deleteZone(id)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al eliminar la zona' }
  }
}

// ---------------------------------------------------------------------------
// Cities
// ---------------------------------------------------------------------------

export async function createCityAction(
  payload: CityFormPayload,
): Promise<ActionResult<AdminShippingCity>> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  const parsed = CityFormSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    const city = await createCity(parsed.data)
    revalidatePath(REVALIDATE)
    return { success: true, data: city }
  } catch {
    return { success: false, error: 'Error al agregar la ciudad' }
  }
}

export async function deleteCityAction(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  try {
    await deleteCity(id)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al eliminar la ciudad' }
  }
}

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

export async function createMethodAction(
  payload: MethodFormPayload,
): Promise<ActionResult<AdminShippingMethod>> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  const parsed = MethodFormSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    const method = await createMethod(parsed.data)
    revalidatePath(REVALIDATE)
    return { success: true, data: method }
  } catch {
    return { success: false, error: 'Error al crear el método' }
  }
}

export async function updateMethodAction(
  id: string,
  payload: MethodFormPayload,
): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  const parsed = MethodFormSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    await updateMethod(id, parsed.data)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar el método' }
  }
}

export async function toggleMethodActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  try {
    await toggleMethodActive(id, isActive)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al cambiar estado del método' }
  }
}

export async function deleteMethodAction(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  try {
    await deleteMethod(id)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al eliminar el método' }
  }
}

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

export async function createRateAction(
  payload: RateFormPayload,
): Promise<ActionResult<AdminShippingRate>> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  const parsed = RateFormSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    const rate = await createRate(parsed.data)
    revalidatePath(REVALIDATE)
    return { success: true, data: rate }
  } catch {
    return { success: false, error: 'Error al crear la tarifa' }
  }
}

export async function updateRateAction(
  id: string,
  payload: RateFormPayload,
): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  const parsed = RateFormSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  try {
    await updateRate(id, parsed.data)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al actualizar la tarifa' }
  }
}

export async function deleteRateAction(id: string): Promise<ActionResult> {
  const actor = await getActor()
  if (!actor) return noAuth()
  if (!actor.permissions.includes('shipping:write')) return noPerm()

  try {
    await deleteRate(id)
    revalidatePath(REVALIDATE)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Error al eliminar la tarifa' }
  }
}
