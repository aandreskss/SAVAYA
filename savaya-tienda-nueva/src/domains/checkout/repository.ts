import { db } from '@/shared/lib/db'
import { paymentMethods } from '@/domains/payment-methods/schema'
import {
  shippingZones,
  shippingCities,
  shippingMethods,
  shippingRates,
} from '@/domains/shipping/schema'
import { applicationSettings } from '@/domains/settings/schema'
import { eq } from 'drizzle-orm'
import type {
  PaymentMethodOption,
  ShippingOption,
  CheckoutInitialData,
} from './types'

// ── Payment methods ───────────────────────────────────────────────────────────

export async function getActivePaymentMethods(): Promise<PaymentMethodOption[]> {
  if (!process.env.DATABASE_URL) return MOCK_PAYMENT_METHODS

  const rows = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.isActive, true))
    .orderBy(paymentMethods.sortOrder)

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as PaymentMethodOption['type'],
    currency: r.currency as PaymentMethodOption['currency'],
    isActive: r.isActive,
    instructions: r.instructions,
    accountDetails: r.accountDetails as Record<string, string> | null,
    iconUrl: r.iconUrl,
    sortOrder: r.sortOrder,
  }))
}

// ── Shipping options ──────────────────────────────────────────────────────────

export async function getShippingOptions(): Promise<ShippingOption[]> {
  if (!process.env.DATABASE_URL) return MOCK_SHIPPING_OPTIONS

  const zones = await db
    .select()
    .from(shippingZones)
    .where(eq(shippingZones.isActive, true))
    .orderBy(shippingZones.sortOrder)

  if (zones.length === 0) return []

  const [cities, methods] = await Promise.all([
    db.select().from(shippingCities).where(eq(shippingCities.isActive, true)),
    db.select().from(shippingMethods).where(eq(shippingMethods.isActive, true)),
  ])

  const methodIds = methods.map((m) => m.id)
  const rates =
    methodIds.length > 0
      ? await db.select().from(shippingRates)
      : []

  return zones.map((zone) => ({
    zone: {
      id: zone.id,
      name: zone.name,
      type: zone.type as ShippingOption['zone']['type'],
      isActive: zone.isActive,
    },
    cities: cities
      .filter((c) => c.zoneId === zone.id)
      .map((c) => ({
        id: c.id,
        zoneId: c.zoneId,
        name: c.name,
        state: c.state,
      })),
    methods: methods
      .filter((m) => m.zoneId === zone.id)
      .map((m) => ({
        id: m.id,
        zoneId: m.zoneId,
        name: m.name,
        provider: m.provider,
        estimatedDays: m.estimatedDays,
        isActive: m.isActive,
      })),
    rates: rates
      .filter((r) => methods.some((m) => m.id === r.methodId && m.zoneId === zone.id))
      .map((r) => ({
        id: r.id,
        methodId: r.methodId,
        cityId: r.cityId,
        minOrderUsd: Number(r.minOrderUsd),
        maxOrderUsd: r.maxOrderUsd !== null ? Number(r.maxOrderUsd) : null,
        rateUsd: Number(r.rateUsd),
        freeShippingThresholdUsd:
          r.freeShippingThresholdUsd !== null ? Number(r.freeShippingThresholdUsd) : null,
      })),
  }))
}

// ── Application settings ──────────────────────────────────────────────────────

export async function getCheckoutSettings(): Promise<{
  partialPaymentOptions: number[]
  reservationExpiryHours: number
}> {
  if (!process.env.DATABASE_URL) {
    return { partialPaymentOptions: [20, 35, 50], reservationExpiryHours: 24 }
  }

  const rows = await db
    .select({ key: applicationSettings.key, value: applicationSettings.value })
    .from(applicationSettings)

  const map = new Map(rows.map((r) => [r.key, r.value]))

  const partialRaw = map.get('partial_payment_options') ?? '20,35,50'
  const partialPaymentOptions = partialRaw
    .split(',')
    .map((v) => parseInt(v.trim(), 10))
    .filter((v) => !isNaN(v))

  const reservationExpiryHours = parseInt(
    map.get('reservation_expiry_hours') ?? '24',
    10,
  )

  return { partialPaymentOptions, reservationExpiryHours }
}

// ── Aggregate initial data ────────────────────────────────────────────────────

export async function getCheckoutInitialData(
  cartSubtotalUsd: number,
  cartItemCount: number,
  exchangeRate: number,
): Promise<CheckoutInitialData> {
  const [paymentMethodsList, shippingOptions, settings] = await Promise.all([
    getActivePaymentMethods(),
    getShippingOptions(),
    getCheckoutSettings(),
  ])

  return {
    paymentMethods: paymentMethodsList,
    shippingOptions,
    exchangeRate,
    partialPaymentOptions: settings.partialPaymentOptions,
    reservationExpiryHours: settings.reservationExpiryHours,
    cartSubtotalUsd,
    cartItemCount,
  }
}

// ── Dev fallbacks ─────────────────────────────────────────────────────────────

const MOCK_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'pm-zelle',
    name: 'Zelle',
    type: 'zelle',
    currency: 'usd',
    isActive: true,
    instructions: 'Realiza tu transferencia Zelle al email indicado.',
    accountDetails: { email: 'pagos@savaya.com', holder: 'Savaya SRL' },
    iconUrl: null,
    sortOrder: 1,
  },
  {
    id: 'pm-pago-movil',
    name: 'Pago Móvil',
    type: 'pago_movil',
    currency: 'ves',
    isActive: true,
    instructions: 'Pago Móvil al banco, teléfono y cédula indicados.',
    accountDetails: {
      bank: 'Banesco',
      phone: '04140000000',
      rif: 'J-000000000',
    },
    iconUrl: null,
    sortOrder: 2,
  },
  {
    id: 'pm-cash',
    name: 'Efectivo en tienda',
    type: 'cash',
    currency: 'usd',
    isActive: true,
    instructions: 'Paga en efectivo al retirar en nuestra tienda en Valencia.',
    accountDetails: null,
    iconUrl: null,
    sortOrder: 6,
  },
]

const MOCK_SHIPPING_OPTIONS: ShippingOption[] = [
  {
    zone: { id: 'zone-local', name: 'Delivery Carabobo', type: 'local_delivery', isActive: true },
    cities: [
      { id: 'city-valencia', zoneId: 'zone-local', name: 'Valencia', state: 'Carabobo' },
      { id: 'city-naguanagua', zoneId: 'zone-local', name: 'Naguanagua', state: 'Carabobo' },
    ],
    methods: [
      { id: 'method-local', zoneId: 'zone-local', name: 'Delivery local', provider: null, estimatedDays: 1, isActive: true },
    ],
    rates: [
      { id: 'rate-local', methodId: 'method-local', cityId: null, minOrderUsd: 0, maxOrderUsd: null, rateUsd: 3, freeShippingThresholdUsd: 60 },
    ],
  },
  {
    zone: { id: 'zone-national', name: 'Envío Nacional', type: 'national_agency', isActive: true },
    cities: [
      { id: 'city-caracas', zoneId: 'zone-national', name: 'Caracas', state: 'Distrito Capital' },
    ],
    methods: [
      { id: 'method-mrw', zoneId: 'zone-national', name: 'MRW', provider: 'MRW', estimatedDays: 3, isActive: true },
    ],
    rates: [
      { id: 'rate-mrw', methodId: 'method-mrw', cityId: null, minOrderUsd: 0, maxOrderUsd: null, rateUsd: 5, freeShippingThresholdUsd: 80 },
    ],
  },
  {
    zone: { id: 'zone-pickup', name: 'Retiro en tienda', type: 'pickup', isActive: true },
    cities: [],
    methods: [
      { id: 'method-pickup', zoneId: 'zone-pickup', name: 'Retiro en Valencia', provider: null, estimatedDays: 0, isActive: true },
    ],
    rates: [
      { id: 'rate-pickup', methodId: 'method-pickup', cityId: null, minOrderUsd: 0, maxOrderUsd: null, rateUsd: 0, freeShippingThresholdUsd: null },
    ],
  },
]
