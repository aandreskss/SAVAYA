import { db } from '@/shared/lib/db'
import { eq, asc, inArray } from 'drizzle-orm'
import {
  shippingZones,
  shippingCities,
  shippingMethods,
  shippingRates,
} from './schema'
import type {
  AdminShippingZone,
  AdminShippingCity,
  AdminShippingMethod,
  AdminShippingRate,
  ShippingZoneType,
} from './types'
import type {
  ZoneFormPayload,
  CityFormPayload,
  MethodFormPayload,
  RateFormPayload,
} from './validators'

// ---------------------------------------------------------------------------
// List all zones with nested data
// ---------------------------------------------------------------------------

export async function listAdminZones(): Promise<AdminShippingZone[]> {
  const zones = await db
    .select()
    .from(shippingZones)
    .orderBy(asc(shippingZones.sortOrder), asc(shippingZones.createdAt))

  if (zones.length === 0) return []

  const zoneIds = zones.map((z) => z.id)

  const [cities, methods] = await Promise.all([
    db.select().from(shippingCities).where(inArray(shippingCities.zoneId, zoneIds)),
    db.select().from(shippingMethods).where(inArray(shippingMethods.zoneId, zoneIds)),
  ])

  const methodIds = methods.map((m) => m.id)
  const rates =
    methodIds.length > 0
      ? await db
          .select()
          .from(shippingRates)
          .where(inArray(shippingRates.methodId, methodIds))
      : []

  return zones.map((zone): AdminShippingZone => ({
    id: zone.id,
    name: zone.name,
    type: zone.type as ShippingZoneType,
    isActive: zone.isActive,
    sortOrder: zone.sortOrder,
    cities: cities
      .filter((c) => c.zoneId === zone.id)
      .map((c): AdminShippingCity => ({
        id: c.id,
        zoneId: c.zoneId,
        name: c.name,
        state: c.state,
        isActive: c.isActive,
      })),
    methods: methods
      .filter((m) => m.zoneId === zone.id)
      .map((m): AdminShippingMethod => ({
        id: m.id,
        zoneId: m.zoneId,
        name: m.name,
        provider: m.provider,
        estimatedDays: m.estimatedDays,
        isActive: m.isActive,
        rates: rates
          .filter((r) => r.methodId === m.id)
          .map((r): AdminShippingRate => ({
            id: r.id,
            methodId: r.methodId,
            cityId: r.cityId,
            minOrderUsd: Number(r.minOrderUsd),
            maxOrderUsd: r.maxOrderUsd != null ? Number(r.maxOrderUsd) : null,
            rateUsd: Number(r.rateUsd),
            freeShippingThresholdUsd:
              r.freeShippingThresholdUsd != null
                ? Number(r.freeShippingThresholdUsd)
                : null,
          })),
      })),
  }))
}

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

export async function createZone(payload: ZoneFormPayload): Promise<AdminShippingZone> {
  const [row] = await db
    .insert(shippingZones)
    .values({
      name: payload.name,
      type: payload.type,
      isActive: payload.isActive,
      sortOrder: payload.sortOrder,
    })
    .returning()

  return {
    id: row.id,
    name: row.name,
    type: row.type as ShippingZoneType,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    cities: [],
    methods: [],
  }
}

export async function updateZone(id: string, payload: ZoneFormPayload): Promise<void> {
  await db
    .update(shippingZones)
    .set({
      name: payload.name,
      type: payload.type,
      isActive: payload.isActive,
      sortOrder: payload.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(shippingZones.id, id))
}

export async function toggleZoneActive(id: string, isActive: boolean): Promise<void> {
  await db
    .update(shippingZones)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(shippingZones.id, id))
}

export async function deleteZone(id: string): Promise<void> {
  await db.delete(shippingZones).where(eq(shippingZones.id, id))
}

// ---------------------------------------------------------------------------
// Cities
// ---------------------------------------------------------------------------

export async function createCity(payload: CityFormPayload): Promise<AdminShippingCity> {
  const [row] = await db
    .insert(shippingCities)
    .values({
      zoneId: payload.zoneId,
      name: payload.name,
      state: payload.state,
      isActive: payload.isActive,
    })
    .returning()

  return {
    id: row.id,
    zoneId: row.zoneId,
    name: row.name,
    state: row.state,
    isActive: row.isActive,
  }
}

export async function deleteCity(id: string): Promise<void> {
  await db.delete(shippingCities).where(eq(shippingCities.id, id))
}

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

export async function createMethod(payload: MethodFormPayload): Promise<AdminShippingMethod> {
  const [row] = await db
    .insert(shippingMethods)
    .values({
      zoneId: payload.zoneId,
      name: payload.name,
      provider: payload.provider ?? null,
      estimatedDays: payload.estimatedDays ?? null,
      isActive: payload.isActive,
    })
    .returning()

  return {
    id: row.id,
    zoneId: row.zoneId,
    name: row.name,
    provider: row.provider,
    estimatedDays: row.estimatedDays,
    isActive: row.isActive,
    rates: [],
  }
}

export async function updateMethod(id: string, payload: MethodFormPayload): Promise<void> {
  await db
    .update(shippingMethods)
    .set({
      name: payload.name,
      provider: payload.provider ?? null,
      estimatedDays: payload.estimatedDays ?? null,
      isActive: payload.isActive,
      updatedAt: new Date(),
    })
    .where(eq(shippingMethods.id, id))
}

export async function toggleMethodActive(id: string, isActive: boolean): Promise<void> {
  await db
    .update(shippingMethods)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(shippingMethods.id, id))
}

export async function deleteMethod(id: string): Promise<void> {
  await db.delete(shippingMethods).where(eq(shippingMethods.id, id))
}

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

export async function createRate(payload: RateFormPayload): Promise<AdminShippingRate> {
  const [row] = await db
    .insert(shippingRates)
    .values({
      methodId: payload.methodId,
      cityId: payload.cityId ?? null,
      minOrderUsd: String(payload.minOrderUsd),
      maxOrderUsd: payload.maxOrderUsd != null ? String(payload.maxOrderUsd) : null,
      rateUsd: String(payload.rateUsd),
      freeShippingThresholdUsd:
        payload.freeShippingThresholdUsd != null
          ? String(payload.freeShippingThresholdUsd)
          : null,
    })
    .returning()

  return {
    id: row.id,
    methodId: row.methodId,
    cityId: row.cityId,
    minOrderUsd: Number(row.minOrderUsd),
    maxOrderUsd: row.maxOrderUsd != null ? Number(row.maxOrderUsd) : null,
    rateUsd: Number(row.rateUsd),
    freeShippingThresholdUsd:
      row.freeShippingThresholdUsd != null ? Number(row.freeShippingThresholdUsd) : null,
  }
}

export async function updateRate(id: string, payload: RateFormPayload): Promise<void> {
  await db
    .update(shippingRates)
    .set({
      cityId: payload.cityId ?? null,
      minOrderUsd: String(payload.minOrderUsd),
      maxOrderUsd: payload.maxOrderUsd != null ? String(payload.maxOrderUsd) : null,
      rateUsd: String(payload.rateUsd),
      freeShippingThresholdUsd:
        payload.freeShippingThresholdUsd != null
          ? String(payload.freeShippingThresholdUsd)
          : null,
      updatedAt: new Date(),
    })
    .where(eq(shippingRates.id, id))
}

export async function deleteRate(id: string): Promise<void> {
  await db.delete(shippingRates).where(eq(shippingRates.id, id))
}
