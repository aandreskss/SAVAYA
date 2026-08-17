export type ShippingZoneType = 'local_delivery' | 'national_agency' | 'pickup'

export type AdminShippingZone = {
  id: string
  name: string
  type: ShippingZoneType
  isActive: boolean
  sortOrder: number
  cities: AdminShippingCity[]
  methods: AdminShippingMethod[]
}

export type AdminShippingCity = {
  id: string
  zoneId: string
  name: string
  state: string
  isActive: boolean
}

export type AdminShippingMethod = {
  id: string
  zoneId: string
  name: string
  provider: string | null
  estimatedDays: number | null
  isActive: boolean
  rates: AdminShippingRate[]
}

export type AdminShippingRate = {
  id: string
  methodId: string
  cityId: string | null
  minOrderUsd: number
  maxOrderUsd: number | null
  rateUsd: number
  freeShippingThresholdUsd: number | null
}
