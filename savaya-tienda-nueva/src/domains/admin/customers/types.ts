export type CustomerTag =
  | 'new'
  | 'returning'
  | 'vip'
  | 'high_ticket'
  | 'inactive'
  | 'frequent'
  | 'wholesale'

export const TAG_CONFIG: Record<CustomerTag, { label: string; color: string }> = {
  new:         { label: 'Nuevo',        color: 'bg-success/10 text-success' },
  returning:   { label: 'Recurrente',   color: 'bg-accent-gold-soft text-accent-gold' },
  vip:         { label: 'VIP',          color: 'bg-accent-gold text-text-primary-inverse' },
  high_ticket: { label: 'Alto ticket',  color: 'bg-accent-gold-soft text-accent-gold' },
  inactive:    { label: 'Inactivo',     color: 'bg-border text-text-secondary' },
  frequent:    { label: 'Frecuente',    color: 'bg-success/10 text-success' },
  wholesale:   { label: 'Mayorista',    color: 'bg-error/10 text-error' },
}

// NOTE: Tag assignment criteria (for future automation):
// - new: first order within the last 30 days → totalOrders === 1
// - returning: 2+ orders
// - frequent: 4+ orders in the last 90 days
// - vip: manual only (high value + loyalty, subjective)
// - high_ticket: manual or avg ticket > $X (threshold TBD with business)
// - inactive: no order in 180+ days
// - wholesale: manually assigned when onboarding a wholesale account
// Not automated now — no real order volume to calibrate thresholds.

export type CustomerListItem = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  whatsapp: string | null
  isActive: boolean
  totalOrders: number
  totalSpentUsd: string
  lastOrderAt: Date | null
  createdAt: Date
  tags: CustomerTag[]
  city: string | null
  state: string | null
}

export type CustomerNote = {
  id: string
  content: string
  authorEmail: string | null
  createdAt: Date
}

export type CustomerOrderSummary = {
  id: string
  orderNumber: string
  status: string
  totalUsd: string
  totalBs: string
  itemCount: number
  createdAt: Date
}

export type CustomerDetail = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  whatsapp: string | null
  isActive: boolean
  totalOrders: number
  totalSpentUsd: string
  avgTicketUsd: string
  lastOrderAt: Date | null
  createdAt: Date
  tags: CustomerTag[]
  notes: CustomerNote[]
  recentOrders: CustomerOrderSummary[]
  addresses: Array<{
    id: string
    label: string
    state: string
    city: string
    address: string
    isDefault: boolean
  }>
}

export type AdminCustomerFilters = {
  search?: string
  tag?: CustomerTag
  page?: number
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
