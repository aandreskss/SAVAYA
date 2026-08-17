'use client'

import { useState, useTransition } from 'react'
import { Button, Modal, Badge } from '@/shared/ui'
import { toast } from '@/shared/ui/Toast'
import type {
  AdminShippingZone,
  AdminShippingCity,
  AdminShippingMethod,
  AdminShippingRate,
  ShippingZoneType,
} from '@/domains/shipping/types'
import type {
  ZoneFormPayload,
  CityFormPayload,
  MethodFormPayload,
  RateFormPayload,
} from '@/domains/shipping/validators'
import {
  createZoneAction,
  updateZoneAction,
  toggleZoneActiveAction,
  deleteZoneAction,
  createCityAction,
  deleteCityAction,
  createMethodAction,
  updateMethodAction,
  toggleMethodActiveAction,
  deleteMethodAction,
  createRateAction,
  updateRateAction,
  deleteRateAction,
} from '../actions'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZONE_TYPE_LABELS: Record<ShippingZoneType, string> = {
  local_delivery: 'Delivery local',
  national_agency: 'Agencia nacional',
  pickup: 'Retiro en tienda',
}

const ZONE_TYPE_BADGE: Record<ShippingZoneType, 'success' | 'warning' | 'outline'> = {
  local_delivery: 'success',
  national_agency: 'warning',
  pickup: 'outline',
}

// ---------------------------------------------------------------------------
// Shared CSS
// ---------------------------------------------------------------------------

const inputCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold placeholder:text-text-secondary/50'
const labelCls = 'block text-xs font-medium text-text-secondary mb-1'
const selectCls =
  'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-accent-gold'

// ---------------------------------------------------------------------------
// Zone form
// ---------------------------------------------------------------------------

type ZoneFormState = {
  name: string
  type: ShippingZoneType
  sortOrder: string
  isActive: boolean
}

function defaultZoneForm(zone?: AdminShippingZone): ZoneFormState {
  return {
    name: zone?.name ?? '',
    type: zone?.type ?? 'local_delivery',
    sortOrder: String(zone?.sortOrder ?? 0),
    isActive: zone?.isActive ?? true,
  }
}

function ZoneForm({
  initial,
  onSubmit,
  isPending,
}: {
  initial?: AdminShippingZone
  onSubmit: (p: ZoneFormPayload) => void
  isPending: boolean
}) {
  const [form, setForm] = useState<ZoneFormState>(defaultZoneForm(initial))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          name: form.name.trim(),
          type: form.type,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        })
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label className={labelCls}>Nombre *</label>
        <input
          required
          className={inputCls}
          placeholder="Ej. Valencia y área metro"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo *</label>
          <select
            className={selectCls}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ShippingZoneType }))}
          >
            <option value="local_delivery">Delivery local</option>
            <option value="national_agency">Agencia nacional</option>
            <option value="pickup">Retiro en tienda</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Orden</label>
          <input
            type="number"
            min="0"
            step="1"
            className={inputCls}
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="w-4 h-4 accent-[var(--color-accent-gold)]"
        />
        Activa
      </label>
      <Button type="submit" isLoading={isPending} className="w-full">
        {initial ? 'Guardar cambios' : 'Crear zona'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// City form
// ---------------------------------------------------------------------------

function CityForm({
  zoneId,
  onSubmit,
  isPending,
}: {
  zoneId: string
  onSubmit: (p: CityFormPayload) => void
  isPending: boolean
}) {
  const [name, setName] = useState('')
  const [state, setState] = useState('')
  const [isActive, setIsActive] = useState(true)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ zoneId, name: name.trim(), state: state.trim(), isActive })
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Ciudad *</label>
          <input
            required
            className={inputCls}
            placeholder="Ej. Valencia"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Estado *</label>
          <input
            required
            className={inputCls}
            placeholder="Ej. Carabobo"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 accent-[var(--color-accent-gold)]"
        />
        Activa
      </label>
      <Button type="submit" isLoading={isPending} className="w-full">
        Agregar ciudad
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Method form
// ---------------------------------------------------------------------------

type MethodFormState = {
  name: string
  provider: string
  estimatedDays: string
  isActive: boolean
}

function defaultMethodForm(m?: AdminShippingMethod): MethodFormState {
  return {
    name: m?.name ?? '',
    provider: m?.provider ?? '',
    estimatedDays: m?.estimatedDays != null ? String(m.estimatedDays) : '',
    isActive: m?.isActive ?? true,
  }
}

function MethodForm({
  zoneId,
  initial,
  onSubmit,
  isPending,
}: {
  zoneId: string
  initial?: AdminShippingMethod
  onSubmit: (p: MethodFormPayload) => void
  isPending: boolean
}) {
  const [form, setForm] = useState<MethodFormState>(defaultMethodForm(initial))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          zoneId,
          name: form.name.trim(),
          provider: form.provider.trim() || null,
          estimatedDays: form.estimatedDays ? Number(form.estimatedDays) : null,
          isActive: form.isActive,
        })
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <label className={labelCls}>Nombre *</label>
        <input
          required
          className={inputCls}
          placeholder="Ej. Domicilio express"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Proveedor / Agencia</label>
          <input
            className={inputCls}
            placeholder="Ej. Zoom, MRW"
            value={form.provider}
            onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelCls}>Días estimados</label>
          <input
            type="number"
            min="0"
            step="1"
            className={inputCls}
            placeholder="Ej. 2"
            value={form.estimatedDays}
            onChange={(e) => setForm((f) => ({ ...f, estimatedDays: e.target.value }))}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          className="w-4 h-4 accent-[var(--color-accent-gold)]"
        />
        Activo
      </label>
      <Button type="submit" isLoading={isPending} className="w-full">
        {initial ? 'Guardar cambios' : 'Crear método'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Rate form
// ---------------------------------------------------------------------------

type RateFormState = {
  cityId: string
  minOrderUsd: string
  maxOrderUsd: string
  rateUsd: string
  freeShippingThresholdUsd: string
}

function defaultRateForm(r?: AdminShippingRate): RateFormState {
  return {
    cityId: r?.cityId ?? '',
    minOrderUsd: r ? String(r.minOrderUsd) : '0',
    maxOrderUsd: r?.maxOrderUsd != null ? String(r.maxOrderUsd) : '',
    rateUsd: r ? String(r.rateUsd) : '',
    freeShippingThresholdUsd:
      r?.freeShippingThresholdUsd != null ? String(r.freeShippingThresholdUsd) : '',
  }
}

function RateForm({
  methodId,
  cities,
  initial,
  onSubmit,
  isPending,
}: {
  methodId: string
  cities: AdminShippingCity[]
  initial?: AdminShippingRate
  onSubmit: (p: RateFormPayload) => void
  isPending: boolean
}) {
  const [form, setForm] = useState<RateFormState>(defaultRateForm(initial))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          methodId,
          cityId: form.cityId || null,
          minOrderUsd: Number(form.minOrderUsd) || 0,
          maxOrderUsd: form.maxOrderUsd ? Number(form.maxOrderUsd) : null,
          rateUsd: Number(form.rateUsd),
          freeShippingThresholdUsd: form.freeShippingThresholdUsd
            ? Number(form.freeShippingThresholdUsd)
            : null,
        })
      }}
      className="flex flex-col gap-4"
    >
      {cities.length > 0 && (
        <div>
          <label className={labelCls}>Ciudad (vacío = aplica a todas)</label>
          <select
            className={selectCls}
            value={form.cityId}
            onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
          >
            <option value="">Todas las ciudades</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.state})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Monto mínimo (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            placeholder="0"
            value={form.minOrderUsd}
            onChange={(e) => setForm((f) => ({ ...f, minOrderUsd: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelCls}>Monto máximo (USD)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={inputCls}
            placeholder="Sin límite"
            value={form.maxOrderUsd}
            onChange={(e) => setForm((f) => ({ ...f, maxOrderUsd: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Costo envío (USD) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            placeholder="0.00"
            value={form.rateUsd}
            onChange={(e) => setForm((f) => ({ ...f, rateUsd: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelCls}>Gratis desde (USD)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={inputCls}
            placeholder="Sin umbral"
            value={form.freeShippingThresholdUsd}
            onChange={(e) =>
              setForm((f) => ({ ...f, freeShippingThresholdUsd: e.target.value }))
            }
          />
        </div>
      </div>
      <Button type="submit" isLoading={isPending} className="w-full">
        {initial ? 'Guardar tarifa' : 'Agregar tarifa'}
      </Button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

function patchZone(
  zones: AdminShippingZone[],
  zoneId: string,
  fn: (z: AdminShippingZone) => AdminShippingZone,
): AdminShippingZone[] {
  return zones.map((z) => (z.id === zoneId ? fn(z) : z))
}

function patchMethod(
  zones: AdminShippingZone[],
  zoneId: string,
  methodId: string,
  fn: (m: AdminShippingMethod) => AdminShippingMethod,
): AdminShippingZone[] {
  return patchZone(zones, zoneId, (z) => ({
    ...z,
    methods: z.methods.map((m) => (m.id === methodId ? fn(m) : m)),
  }))
}

// ---------------------------------------------------------------------------
// DeliveryManager
// ---------------------------------------------------------------------------

type Props = { initialZones: AdminShippingZone[] }

export function DeliveryManager({ initialZones }: Props) {
  const [zones, setZones] = useState(initialZones)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'cities' | 'methods'>('cities')
  const [isPending, startTransition] = useTransition()

  const [zoneModal, setZoneModal] = useState<
    | 'closed'
    | 'create'
    | { mode: 'edit'; zone: AdminShippingZone }
    | { mode: 'delete'; zone: AdminShippingZone }
  >('closed')

  const [cityModal, setCityModal] = useState<
    'closed' | 'create' | { mode: 'delete'; city: AdminShippingCity }
  >('closed')

  const [methodModal, setMethodModal] = useState<
    | 'closed'
    | 'create'
    | { mode: 'edit'; method: AdminShippingMethod }
    | { mode: 'delete'; method: AdminShippingMethod }
  >('closed')

  const [rateModal, setRateModal] = useState<
    | 'closed'
    | { mode: 'create'; methodId: string }
    | { mode: 'edit'; rate: AdminShippingRate; methodId: string }
    | { mode: 'delete'; rate: AdminShippingRate; methodId: string }
  >('closed')

  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? null

  // ---------------------------------------------------------------------------
  // Zone handlers
  // ---------------------------------------------------------------------------

  function handleCreateZone(payload: ZoneFormPayload) {
    startTransition(async () => {
      const res = await createZoneAction(payload)
      if (res.success) {
        setZones((prev) => [...prev, res.data])
        setZoneModal('closed')
        toast.success('Zona creada')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleUpdateZone(id: string, payload: ZoneFormPayload) {
    startTransition(async () => {
      const res = await updateZoneAction(id, payload)
      if (res.success) {
        setZones((prev) =>
          patchZone(prev, id, (z) => ({
            ...z,
            name: payload.name,
            type: payload.type,
            sortOrder: payload.sortOrder,
            isActive: payload.isActive,
          })),
        )
        setZoneModal('closed')
        toast.success('Zona actualizada')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleToggleZone(id: string, isActive: boolean) {
    startTransition(async () => {
      const res = await toggleZoneActiveAction(id, isActive)
      if (res.success) {
        setZones((prev) => patchZone(prev, id, (z) => ({ ...z, isActive })))
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDeleteZone(id: string) {
    startTransition(async () => {
      const res = await deleteZoneAction(id)
      if (res.success) {
        setZones((prev) => prev.filter((z) => z.id !== id))
        if (selectedZoneId === id) setSelectedZoneId(null)
        setZoneModal('closed')
        toast.success('Zona eliminada')
      } else {
        toast.error(res.error)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // City handlers
  // ---------------------------------------------------------------------------

  function handleCreateCity(payload: CityFormPayload) {
    startTransition(async () => {
      const res = await createCityAction(payload)
      if (res.success) {
        setZones((prev) =>
          patchZone(prev, payload.zoneId, (z) => ({ ...z, cities: [...z.cities, res.data] })),
        )
        setCityModal('closed')
        toast.success('Ciudad agregada')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDeleteCity(city: AdminShippingCity) {
    startTransition(async () => {
      const res = await deleteCityAction(city.id)
      if (res.success) {
        setZones((prev) =>
          patchZone(prev, city.zoneId, (z) => ({
            ...z,
            cities: z.cities.filter((c) => c.id !== city.id),
          })),
        )
        setCityModal('closed')
        toast.success('Ciudad eliminada')
      } else {
        toast.error(res.error)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Method handlers
  // ---------------------------------------------------------------------------

  function handleCreateMethod(payload: MethodFormPayload) {
    startTransition(async () => {
      const res = await createMethodAction(payload)
      if (res.success) {
        setZones((prev) =>
          patchZone(prev, payload.zoneId, (z) => ({
            ...z,
            methods: [...z.methods, res.data],
          })),
        )
        setMethodModal('closed')
        toast.success('Método creado')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleUpdateMethod(id: string, zoneId: string, payload: MethodFormPayload) {
    startTransition(async () => {
      const res = await updateMethodAction(id, payload)
      if (res.success) {
        setZones((prev) =>
          patchMethod(prev, zoneId, id, (m) => ({
            ...m,
            name: payload.name,
            provider: payload.provider ?? null,
            estimatedDays: payload.estimatedDays ?? null,
            isActive: payload.isActive,
          })),
        )
        setMethodModal('closed')
        toast.success('Método actualizado')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleToggleMethod(methodId: string, zoneId: string, isActive: boolean) {
    startTransition(async () => {
      const res = await toggleMethodActiveAction(methodId, isActive)
      if (res.success) {
        setZones((prev) => patchMethod(prev, zoneId, methodId, (m) => ({ ...m, isActive })))
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDeleteMethod(method: AdminShippingMethod) {
    startTransition(async () => {
      const res = await deleteMethodAction(method.id)
      if (res.success) {
        setZones((prev) =>
          patchZone(prev, method.zoneId, (z) => ({
            ...z,
            methods: z.methods.filter((m) => m.id !== method.id),
          })),
        )
        setMethodModal('closed')
        toast.success('Método eliminado')
      } else {
        toast.error(res.error)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Rate handlers
  // ---------------------------------------------------------------------------

  function findRateZoneId(methodId: string): string {
    return zones.find((z) => z.methods.some((m) => m.id === methodId))?.id ?? ''
  }

  function handleCreateRate(payload: RateFormPayload) {
    startTransition(async () => {
      const res = await createRateAction(payload)
      if (res.success) {
        const zoneId = findRateZoneId(payload.methodId)
        setZones((prev) =>
          patchMethod(prev, zoneId, payload.methodId, (m) => ({
            ...m,
            rates: [...m.rates, res.data],
          })),
        )
        setRateModal('closed')
        toast.success('Tarifa agregada')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleUpdateRate(id: string, payload: RateFormPayload) {
    startTransition(async () => {
      const res = await updateRateAction(id, payload)
      if (res.success) {
        const zoneId = findRateZoneId(payload.methodId)
        setZones((prev) =>
          patchMethod(prev, zoneId, payload.methodId, (m) => ({
            ...m,
            rates: m.rates.map((r) =>
              r.id === id
                ? {
                    ...r,
                    cityId: payload.cityId ?? null,
                    minOrderUsd: payload.minOrderUsd,
                    maxOrderUsd: payload.maxOrderUsd ?? null,
                    rateUsd: payload.rateUsd,
                    freeShippingThresholdUsd: payload.freeShippingThresholdUsd ?? null,
                  }
                : r,
            ),
          })),
        )
        setRateModal('closed')
        toast.success('Tarifa actualizada')
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleDeleteRate(rate: AdminShippingRate) {
    startTransition(async () => {
      const res = await deleteRateAction(rate.id)
      if (res.success) {
        const zoneId = findRateZoneId(rate.methodId)
        setZones((prev) =>
          patchMethod(prev, zoneId, rate.methodId, (m) => ({
            ...m,
            rates: m.rates.filter((r) => r.id !== rate.id),
          })),
        )
        setRateModal('closed')
        toast.success('Tarifa eliminada')
      } else {
        toast.error(res.error)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Delivery</h1>
          <p className="text-sm text-text-secondary mt-1">
            {zones.length} {zones.length === 1 ? 'zona' : 'zonas'} configuradas
          </p>
        </div>
        <Button onClick={() => setZoneModal('create')}>Nueva zona</Button>
      </div>

      {/* Split layout */}
      <div className="flex gap-5 items-start">
        {/* Zone list */}
        <div className="w-72 shrink-0 flex flex-col gap-2">
          {zones.length === 0 ? (
            <div className="border border-border border-dashed rounded-xl p-8 text-center text-text-secondary text-sm">
              Sin zonas. Crea la primera.
            </div>
          ) : (
            zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setSelectedZoneId(zone.id)}
                className={`w-full text-left border rounded-xl p-4 transition-colors ${
                  selectedZoneId === zone.id
                    ? 'border-accent-gold bg-accent-gold/5'
                    : 'border-border bg-surface hover:border-border-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-sm text-text-primary leading-snug">{zone.name}</p>
                  <Badge variant={zone.isActive ? 'success' : 'default'} size="sm">
                    {zone.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <Badge variant={ZONE_TYPE_BADGE[zone.type]} size="sm">
                  {ZONE_TYPE_LABELS[zone.type]}
                </Badge>
                <p className="text-xs text-text-secondary mt-2">
                  {zone.cities.length} ciudades · {zone.methods.length} métodos
                </p>
                <div
                  className="flex gap-1 mt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={isPending}
                    onClick={() => handleToggleZone(zone.id, !zone.isActive)}
                    className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                  >
                    {zone.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => setZoneModal({ mode: 'edit', zone })}
                    className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setZoneModal({ mode: 'delete', zone })}
                    className="text-xs text-error hover:text-error/80 px-2 py-1 rounded hover:bg-error/10 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Zone detail */}
        <div className="flex-1 min-w-0">
          {!selectedZone ? (
            <div className="border border-border border-dashed rounded-xl p-14 text-center text-text-secondary text-sm">
              Selecciona una zona para ver su configuración
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              {/* Detail header */}
              <div className="bg-surface px-5 py-4 border-b border-border flex items-center gap-3">
                <div>
                  <p className="font-semibold text-text-primary">{selectedZone.name}</p>
                  <Badge variant={ZONE_TYPE_BADGE[selectedZone.type]} size="sm" className="mt-1">
                    {ZONE_TYPE_LABELS[selectedZone.type]}
                  </Badge>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border px-5 gap-0">
                {(['cities', 'methods'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab
                        ? 'border-accent-gold text-text-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {tab === 'cities'
                      ? `Ciudades (${selectedZone.cities.length})`
                      : `Métodos (${selectedZone.methods.length})`}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Cities tab */}
                {activeTab === 'cities' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-text-secondary">
                        {selectedZone.type === 'pickup'
                          ? 'Las ciudades no aplican para zonas de retiro.'
                          : 'Ciudades cubiertas por esta zona.'}
                      </p>
                      {selectedZone.type !== 'pickup' && (
                        <Button size="sm" onClick={() => setCityModal('create')}>
                          Agregar ciudad
                        </Button>
                      )}
                    </div>

                    {selectedZone.cities.length === 0 ? (
                      <p className="text-sm text-text-secondary/60 text-center py-10">
                        Sin ciudades. Agrega la primera.
                      </p>
                    ) : (
                      <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-surface border-b border-border">
                            <tr>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                                Ciudad
                              </th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                                Estado
                              </th>
                              <th className="text-left px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                                Activa
                              </th>
                              <th className="px-4 py-2" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {selectedZone.cities.map((city) => (
                              <tr key={city.id} className="bg-surface">
                                <td className="px-4 py-2.5 text-text-primary">{city.name}</td>
                                <td className="px-4 py-2.5 text-text-secondary">{city.state}</td>
                                <td className="px-4 py-2.5">
                                  <Badge variant={city.isActive ? 'success' : 'default'} size="sm">
                                    {city.isActive ? 'Sí' : 'No'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <button
                                    onClick={() => setCityModal({ mode: 'delete', city })}
                                    className="text-xs text-error hover:text-error/80 px-2 py-1 rounded hover:bg-error/10 transition-colors"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Methods tab */}
                {activeTab === 'methods' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-text-secondary">
                        Métodos de envío y sus tarifas.
                      </p>
                      <Button size="sm" onClick={() => setMethodModal('create')}>
                        Agregar método
                      </Button>
                    </div>

                    {selectedZone.methods.length === 0 ? (
                      <p className="text-sm text-text-secondary/60 text-center py-10">
                        Sin métodos. Agrega el primero.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {selectedZone.methods.map((method) => (
                          <div
                            key={method.id}
                            className="border border-border rounded-lg overflow-hidden"
                          >
                            {/* Method header */}
                            <div className="bg-surface px-4 py-3 flex items-center justify-between border-b border-border">
                              <div className="flex items-center gap-2.5">
                                <Badge
                                  variant={method.isActive ? 'success' : 'default'}
                                  size="sm"
                                >
                                  {method.isActive ? 'Activo' : 'Inactivo'}
                                </Badge>
                                <span className="font-medium text-sm text-text-primary">
                                  {method.name}
                                </span>
                                {method.provider && (
                                  <span className="text-xs text-text-secondary">
                                    · {method.provider}
                                  </span>
                                )}
                                {method.estimatedDays != null && (
                                  <span className="text-xs text-text-secondary">
                                    · {method.estimatedDays}d est.
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  disabled={isPending}
                                  onClick={() =>
                                    handleToggleMethod(
                                      method.id,
                                      method.zoneId,
                                      !method.isActive,
                                    )
                                  }
                                  className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                                >
                                  {method.isActive ? 'Desactivar' : 'Activar'}
                                </button>
                                <button
                                  onClick={() => setMethodModal({ mode: 'edit', method })}
                                  className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-2 transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => setMethodModal({ mode: 'delete', method })}
                                  className="text-xs text-error hover:text-error/80 px-2 py-1 rounded hover:bg-error/10 transition-colors"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>

                            {/* Rates */}
                            <div className="px-4 py-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                                  Tarifas
                                </span>
                                <button
                                  onClick={() =>
                                    setRateModal({ mode: 'create', methodId: method.id })
                                  }
                                  className="text-xs text-accent-gold hover:text-accent-gold/80 transition-colors"
                                >
                                  + Agregar tarifa
                                </button>
                              </div>

                              {method.rates.length === 0 ? (
                                <p className="text-xs text-text-secondary/60 text-center py-4">
                                  Sin tarifas configuradas.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-text-secondary">
                                        <th className="text-left pb-1.5 font-medium pr-4">
                                          Ciudad
                                        </th>
                                        <th className="text-left pb-1.5 font-medium pr-4">
                                          Rango pedido
                                        </th>
                                        <th className="text-left pb-1.5 font-medium pr-4">
                                          Costo envío
                                        </th>
                                        <th className="text-left pb-1.5 font-medium pr-4">
                                          Gratis desde
                                        </th>
                                        <th />
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                      {method.rates.map((rate) => {
                                        const cityName = rate.cityId
                                          ? (selectedZone.cities.find(
                                              (c) => c.id === rate.cityId,
                                            )?.name ?? '—')
                                          : 'Todas'
                                        return (
                                          <tr key={rate.id} className="text-text-primary">
                                            <td className="py-2 pr-4">{cityName}</td>
                                            <td className="py-2 pr-4 tabular-nums text-text-secondary">
                                              ${rate.minOrderUsd.toFixed(0)}
                                              {rate.maxOrderUsd != null
                                                ? ` – $${rate.maxOrderUsd.toFixed(0)}`
                                                : '+'}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums font-semibold">
                                              ${rate.rateUsd.toFixed(2)}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums text-text-secondary">
                                              {rate.freeShippingThresholdUsd != null
                                                ? `$${rate.freeShippingThresholdUsd.toFixed(0)}`
                                                : '—'}
                                            </td>
                                            <td className="py-2 text-right whitespace-nowrap">
                                              <button
                                                onClick={() =>
                                                  setRateModal({
                                                    mode: 'edit',
                                                    rate,
                                                    methodId: method.id,
                                                  })
                                                }
                                                className="text-text-secondary hover:text-text-primary mr-3 transition-colors"
                                              >
                                                Editar
                                              </button>
                                              <button
                                                onClick={() =>
                                                  setRateModal({
                                                    mode: 'delete',
                                                    rate,
                                                    methodId: method.id,
                                                  })
                                                }
                                                className="text-error hover:text-error/80 transition-colors"
                                              >
                                                ×
                                              </button>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- Zone modals ---- */}
      <Modal
        isOpen={zoneModal === 'create'}
        onClose={() => setZoneModal('closed')}
        title="Nueva zona de envío"
        size="md"
      >
        <ZoneForm onSubmit={handleCreateZone} isPending={isPending} />
      </Modal>

      <Modal
        isOpen={typeof zoneModal === 'object' && zoneModal.mode === 'edit'}
        onClose={() => setZoneModal('closed')}
        title="Editar zona"
        size="md"
      >
        {typeof zoneModal === 'object' && zoneModal.mode === 'edit' && (
          <ZoneForm
            initial={zoneModal.zone}
            onSubmit={(p) => handleUpdateZone(zoneModal.zone.id, p)}
            isPending={isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={typeof zoneModal === 'object' && zoneModal.mode === 'delete'}
        onClose={() => setZoneModal('closed')}
        title="Eliminar zona"
      >
        {typeof zoneModal === 'object' && zoneModal.mode === 'delete' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              ¿Eliminar la zona{' '}
              <span className="font-semibold text-text-primary">{zoneModal.zone.name}</span>? Se
              eliminarán también sus ciudades, métodos y tarifas.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setZoneModal('closed')}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                isLoading={isPending}
                onClick={() => handleDeleteZone(zoneModal.zone.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- City modals ---- */}
      <Modal
        isOpen={cityModal === 'create'}
        onClose={() => setCityModal('closed')}
        title="Agregar ciudad"
        size="sm"
      >
        {selectedZone && (
          <CityForm
            zoneId={selectedZone.id}
            onSubmit={handleCreateCity}
            isPending={isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={typeof cityModal === 'object' && cityModal.mode === 'delete'}
        onClose={() => setCityModal('closed')}
        title="Eliminar ciudad"
      >
        {typeof cityModal === 'object' && cityModal.mode === 'delete' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              ¿Eliminar{' '}
              <span className="font-semibold text-text-primary">{cityModal.city.name}</span>? Las
              tarifas vinculadas quedarán sin ciudad asignada.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setCityModal('closed')}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                isLoading={isPending}
                onClick={() => handleDeleteCity(cityModal.city)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Method modals ---- */}
      <Modal
        isOpen={methodModal === 'create'}
        onClose={() => setMethodModal('closed')}
        title="Nuevo método de envío"
        size="sm"
      >
        {selectedZone && (
          <MethodForm
            zoneId={selectedZone.id}
            onSubmit={handleCreateMethod}
            isPending={isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={typeof methodModal === 'object' && methodModal.mode === 'edit'}
        onClose={() => setMethodModal('closed')}
        title="Editar método"
        size="sm"
      >
        {typeof methodModal === 'object' && methodModal.mode === 'edit' && (
          <MethodForm
            zoneId={methodModal.method.zoneId}
            initial={methodModal.method}
            onSubmit={(p) => handleUpdateMethod(methodModal.method.id, methodModal.method.zoneId, p)}
            isPending={isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={typeof methodModal === 'object' && methodModal.mode === 'delete'}
        onClose={() => setMethodModal('closed')}
        title="Eliminar método"
      >
        {typeof methodModal === 'object' && methodModal.mode === 'delete' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              ¿Eliminar el método{' '}
              <span className="font-semibold text-text-primary">{methodModal.method.name}</span>?
              También se eliminarán sus tarifas.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setMethodModal('closed')}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                isLoading={isPending}
                onClick={() => handleDeleteMethod(methodModal.method)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Rate modals ---- */}
      <Modal
        isOpen={typeof rateModal === 'object' && rateModal.mode === 'create'}
        onClose={() => setRateModal('closed')}
        title="Agregar tarifa"
        size="sm"
      >
        {typeof rateModal === 'object' && rateModal.mode === 'create' && (
          <RateForm
            methodId={rateModal.methodId}
            cities={selectedZone?.cities ?? []}
            onSubmit={handleCreateRate}
            isPending={isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={typeof rateModal === 'object' && rateModal.mode === 'edit'}
        onClose={() => setRateModal('closed')}
        title="Editar tarifa"
        size="sm"
      >
        {typeof rateModal === 'object' && rateModal.mode === 'edit' && (
          <RateForm
            methodId={rateModal.methodId}
            cities={selectedZone?.cities ?? []}
            initial={rateModal.rate}
            onSubmit={(p) => handleUpdateRate(rateModal.rate.id, p)}
            isPending={isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={typeof rateModal === 'object' && rateModal.mode === 'delete'}
        onClose={() => setRateModal('closed')}
        title="Eliminar tarifa"
      >
        {typeof rateModal === 'object' && rateModal.mode === 'delete' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              ¿Eliminar esta tarifa de envío? La acción es permanente.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setRateModal('closed')}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                isLoading={isPending}
                onClick={() => handleDeleteRate(rateModal.rate)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
