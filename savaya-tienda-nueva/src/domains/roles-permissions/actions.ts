// ---------------------------------------------------------------------------
// High-risk actions — require step-up re-authentication (< 5 min)
// ---------------------------------------------------------------------------
// Single source of truth. Referenced by the service layer to enforce reauth.
// Any new action that is destructive or financial must be added here.

export const HIGH_RISK_ACTIONS = [
  'change_user_role',
  'approve_payment',
  'change_payment_account',
  'change_integration_key',
  'exchange_rate_manual_override',
  'delete_product',
  'bulk_inventory_adjustment',
] as const

export type HighRiskAction = (typeof HIGH_RISK_ACTIONS)[number]
