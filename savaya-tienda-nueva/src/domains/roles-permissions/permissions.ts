// ---------------------------------------------------------------------------
// Permission constants — single source of truth for RBAC
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  // Catálogo
  CATALOG_READ: 'catalog:read',
  CATALOG_WRITE: 'catalog:write',
  CATALOG_DELETE: 'catalog:delete',
  // Inventario
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  // Pedidos
  ORDERS_READ: 'orders:read',
  ORDERS_WRITE: 'orders:write',
  // Pagos
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_APPROVE: 'payments:approve',
  PAYMENTS_REJECT: 'payments:reject',
  // Clientes
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',
  // Contenido
  CMS_READ: 'cms:read',
  CMS_WRITE: 'cms:write',
  // Promociones
  PROMOTIONS_READ: 'promotions:read',
  PROMOTIONS_WRITE: 'promotions:write',
  // Envíos
  SHIPPING_READ: 'shipping:read',
  SHIPPING_WRITE: 'shipping:write',
  // Tasas
  EXCHANGE_RATES_READ: 'exchange_rates:read',
  EXCHANGE_RATES_WRITE: 'exchange_rates:write',
  EXCHANGE_RATES_OVERRIDE: 'exchange_rates:override', // acción de alto riesgo
  // Analytics
  ANALYTICS_READ: 'analytics:read',
  // Usuarios y roles (solo super admin y admin)
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  ROLES_READ: 'roles:read',
  ROLES_WRITE: 'roles:write', // acción de alto riesgo
  // Configuración
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
  SETTINGS_PAYMENT_ACCOUNTS: 'settings:payment_accounts', // acción de alto riesgo
} as const

/**
 * A valid permission string value (e.g. 'catalog:read').
 * Named PermissionSlug to avoid collision with the Drizzle-inferred `Permission`
 * type exported from db-types.ts (which represents a DB row).
 */
export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// ---------------------------------------------------------------------------
// Role → permissions mapping
// Source of truth for the DB seed script.
// ---------------------------------------------------------------------------

export const ROLE_PERMISSIONS: Record<string, PermissionSlug[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS).filter(
    (p): p is PermissionSlug => p !== 'exchange_rates:override',
  ),
  catalog: ['catalog:read', 'catalog:write', 'catalog:delete', 'inventory:read'],
  inventory: ['inventory:read', 'inventory:write', 'catalog:read'],
  sales: ['orders:read', 'orders:write', 'customers:read', 'payments:read'],
  finance: [
    'payments:read',
    'payments:approve',
    'payments:reject',
    'orders:read',
    'exchange_rates:read',
  ],
  customer_service: ['customers:read', 'customers:write', 'orders:read'],
  marketing: [
    'cms:read',
    'cms:write',
    'promotions:read',
    'promotions:write',
    'analytics:read',
  ],
  analyst: ['analytics:read', 'orders:read', 'customers:read'],
} as const
