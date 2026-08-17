'use client'

import { useState } from 'react'
import { useCheckoutStore } from '../checkout-store'
import { ShippingDataSchema } from '../validators'
import type { ShippingOption, ShippingZoneType, ShippingData } from '../types'

const ZONE_LABELS: Record<ShippingZoneType, { title: string; desc: string; icon: string }> = {
  local_delivery: {
    title: 'Delivery local',
    desc: 'Entrega a domicilio en Carabobo',
    icon: '🛵',
  },
  national_agency: {
    title: 'Envío nacional',
    desc: 'Via encomienda a todo el país',
    icon: '📦',
  },
  pickup: {
    title: 'Retiro en tienda',
    desc: 'Valencia, CC Multi Tienda God is Good',
    icon: '🏪',
  },
}

type Props = {
  shippingOptions: ShippingOption[]
  cartSubtotalUsd: number
}

export function StepShipping({ shippingOptions, cartSubtotalUsd }: Props) {
  const { shippingData, setShippingData, goBack } = useCheckoutStore()

  const [selectedZoneId, setSelectedZoneId] = useState(shippingData?.zoneId ?? '')
  const [selectedMethodId, setSelectedMethodId] = useState(shippingData?.methodId ?? '')
  const [selectedCityId, setSelectedCityId] = useState(shippingData?.cityId ?? '')
  const [recipientName, setRecipientName] = useState(shippingData?.recipientName ?? '')
  const [state, setState] = useState(shippingData?.state ?? '')
  const [city, setCity] = useState(shippingData?.city ?? '')
  const [municipality, setMunicipality] = useState(shippingData?.municipality ?? '')
  const [parish, setParish] = useState(shippingData?.parish ?? '')
  const [address, setAddress] = useState(shippingData?.address ?? '')
  const [reference, setReference] = useState(shippingData?.reference ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedZone = shippingOptions.find((o) => o.zone.id === selectedZoneId)
  const zoneType = selectedZone?.zone.type

  // Calculate shipping cost for the selected method
  function getShippingCost(): number {
    if (!selectedZone || !selectedMethodId) return 0

    const method = selectedZone.methods.find((m) => m.id === selectedMethodId)
    if (!method) return 0

    // Find rate: prefer city-specific, fall back to method-wide
    const methodRates = selectedZone.rates.filter((r) => r.methodId === selectedMethodId)
    const cityRate = methodRates.find((r) => r.cityId === selectedCityId)
    const genericRate = methodRates.find((r) => !r.cityId)
    const rate = cityRate ?? genericRate

    if (!rate) return 0

    // Free shipping threshold
    if (
      rate.freeShippingThresholdUsd !== null &&
      cartSubtotalUsd >= rate.freeShippingThresholdUsd
    ) {
      return 0
    }

    return rate.rateUsd
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const data: ShippingData = {
      zoneId: selectedZoneId,
      zoneType: (zoneType ?? 'pickup') as ShippingZoneType,
      methodId: selectedMethodId,
      cityId: selectedCityId || undefined,
      recipientName,
      state: state || undefined,
      city: city || undefined,
      municipality: municipality || undefined,
      parish: parish || undefined,
      address: address || undefined,
      reference: reference || undefined,
    }

    const result = ShippingDataSchema.safeParse(data)
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (field && !errs[field]) errs[field] = issue.message
      }
      setErrors(errs)
      return
    }

    setErrors({})
    setShippingData(result.data, getShippingCost())
  }

  function selectZone(zoneId: string) {
    setSelectedZoneId(zoneId)
    setSelectedMethodId('')
    setSelectedCityId('')
    setErrors({})
  }

  const shippingCost = getShippingCost()

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-text-primary">
        Método de entrega
      </h2>

      {/* Zone cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {shippingOptions.map((option) => {
          const meta = ZONE_LABELS[option.zone.type]
          const isSelected = selectedZoneId === option.zone.id

          return (
            <button
              key={option.zone.id}
              type="button"
              onClick={() => selectZone(option.zone.id)}
              className={[
                'flex flex-col items-start gap-2 rounded-[var(--radius-md)] border p-4 text-left transition-all',
                isSelected
                  ? 'border-accent-gold bg-[var(--color-accent-gold-soft)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]',
              ].join(' ')}
              aria-pressed={isSelected}
            >
              <span className="text-2xl">{meta.icon}</span>
              <div>
                <p className="font-semibold text-text-primary">{meta.title}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{meta.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Zone-specific fields */}
      {selectedZone && (
        <div className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          {/* Recipient name (all zones) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="recipientName" className="text-sm font-medium">
              Nombre del destinatario
            </label>
            <input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className={`input ${errors.recipientName ? 'border-[var(--color-error)]' : ''}`}
              aria-invalid={!!errors.recipientName}
            />
            {errors.recipientName && (
              <p className="text-xs text-[var(--color-error)]">{errors.recipientName}</p>
            )}
          </div>

          {/* Method selection */}
          {selectedZone.methods.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Servicio de entrega</p>
              {selectedZone.methods.map((method) => {
                const methodRates = selectedZone.rates.filter((r) => r.methodId === method.id)
                const baseRate = methodRates.find((r) => !r.cityId) ?? methodRates[0]
                const freeAt = baseRate?.freeShippingThresholdUsd

                return (
                  <label
                    key={method.id}
                    className={[
                      'flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] border p-3',
                      selectedMethodId === method.id
                        ? 'border-accent-gold bg-[var(--color-accent-gold-soft)]'
                        : 'border-[var(--color-border)]',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="method"
                        value={method.id}
                        checked={selectedMethodId === method.id}
                        onChange={() => setSelectedMethodId(method.id)}
                        className="accent-accent-gold"
                      />
                      <div>
                        <p className="font-medium text-sm">{method.name}</p>
                        {method.estimatedDays !== null && (
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {method.estimatedDays === 0
                              ? 'Inmediato'
                              : `${method.estimatedDays} día${method.estimatedDays > 1 ? 's' : ''} hábil${method.estimatedDays > 1 ? 'es' : ''}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {baseRate ? (
                        freeAt !== null && cartSubtotalUsd >= freeAt ? (
                          <span className="text-sm font-semibold text-[var(--color-success)]">Gratis</span>
                        ) : (
                          <span className="text-sm font-semibold">
                            {baseRate.rateUsd === 0 ? 'Gratis' : `$${baseRate.rateUsd.toFixed(2)}`}
                          </span>
                        )
                      ) : null}
                      {freeAt !== null && cartSubtotalUsd < freeAt && (
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          Gratis desde ${freeAt}
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          {/* City selector (local delivery) */}
          {zoneType === 'local_delivery' && selectedZone.cities.length > 0 && (
            <div className="flex flex-col gap-1">
              <label htmlFor="cityId" className="text-sm font-medium">
                Municipio
              </label>
              <select
                id="cityId"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className={`input ${errors.cityId ? 'border-[var(--color-error)]' : ''}`}
              >
                <option value="">Selecciona tu municipio</option>
                {selectedZone.cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.cityId && (
                <p className="text-xs text-[var(--color-error)]">{errors.cityId}</p>
              )}
            </div>
          )}

          {/* Address fields (local + national) */}
          {(zoneType === 'local_delivery' || zoneType === 'national_agency') && (
            <>
              {zoneType === 'national_agency' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="state" className="text-sm font-medium">Estado</label>
                    <input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={`input ${errors.state ? 'border-[var(--color-error)]' : ''}`}
                    />
                    {errors.state && <p className="text-xs text-[var(--color-error)]">{errors.state}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="city" className="text-sm font-medium">Ciudad</label>
                    <input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`input ${errors.city ? 'border-[var(--color-error)]' : ''}`}
                    />
                    {errors.city && <p className="text-xs text-[var(--color-error)]">{errors.city}</p>}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="municipality" className="text-sm font-medium">
                    Municipio / Parroquia
                  </label>
                  <input
                    id="municipality"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="parish" className="text-sm font-medium">
                    Parroquia <span className="text-[var(--color-text-secondary)]">(opcional)</span>
                  </label>
                  <input
                    id="parish"
                    value={parish}
                    onChange={(e) => setParish(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="address" className="text-sm font-medium">Dirección completa</label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Calle, número de casa, urbanización..."
                  className={`input resize-none ${errors.address ? 'border-[var(--color-error)]' : ''}`}
                />
                {errors.address && <p className="text-xs text-[var(--color-error)]">{errors.address}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="reference" className="text-sm font-medium">
                  Punto de referencia <span className="text-[var(--color-text-secondary)]">(opcional)</span>
                </label>
                <input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Frente al semáforo, al lado de..."
                  className="input"
                />
              </div>
            </>
          )}

          {/* Pickup info */}
          {zoneType === 'pickup' && (
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-accent-gold-soft)] p-3 text-sm">
              <p className="font-medium">Dirección de la tienda</p>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                CC Multi Tienda God is Good, local A-4, Valencia, Carabobo.
              </p>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                Lun – Sáb: 9:00 am – 7:00 pm
              </p>
            </div>
          )}

          {/* Shipping cost preview */}
          {selectedMethodId && (
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-sm">
              <span className="text-[var(--color-text-secondary)]">Costo de envío</span>
              <span className="font-semibold">
                {shippingCost === 0 ? (
                  <span className="text-[var(--color-success)]">Gratis</span>
                ) : (
                  `$${shippingCost.toFixed(2)}`
                )}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={goBack}
          className="btn-secondary flex-1"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={!selectedZoneId || !selectedMethodId}
          className="btn-primary flex-[2] disabled:opacity-50"
        >
          Continuar con el pago
        </button>
      </div>
    </form>
  )
}
