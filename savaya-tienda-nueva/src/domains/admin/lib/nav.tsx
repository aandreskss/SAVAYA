import type { NavItem } from '@/shared/ui/AdminSidebar'
import type { PermissionSlug } from '@/domains/roles-permissions/permissions'

// ---------------------------------------------------------------------------
// Inline SVG icons — no icon library dependency
// ---------------------------------------------------------------------------

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 7.5L9 2l7 5.5V16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 17V11h5v6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 5h12l-1.5 9H4.5L3 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 5V4a2.5 2.5 0 0 1 5 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1.5" y="4" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 7.5h15" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 11.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 2h6l8 8-6 6-8-8V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1.5 16.5 5v8L9 16.5 1.5 13V5L9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 1.5v15M1.5 5l7.5 4 7.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 8c1.4 0 2.5 1.1 2.5 2.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 16c0-1.4.6-2.7 1.5-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function LayoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="15" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 6.5h15M6.5 6.5v10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function PercentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 14 14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="5.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="12.5" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1.5 11V4.5A1.5 1.5 0 0 1 3 3h8.5v8.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11.5 6.5H15l2 4.5v1H11.5V6.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="4.5" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13.5" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function TrendingUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 13l4-4 3 3 5-5 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 5h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 14V8M7.5 14V4M12 14V9.5M16.5 14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1.5 14h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2 2 5v5c0 4 3.1 7.2 7 8 3.9-.8 7-4 7-8V5L9 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 1.5v1.8M9 14.7v1.8M1.5 9h1.8M14.7 9h1.8M3.6 3.6l1.3 1.3M13.1 13.1l1.3 1.3M3.6 14.4l1.3-1.3M13.1 4.9l1.3-1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Nav definition
// ---------------------------------------------------------------------------

/** permission undefined = visible to all authenticated admins (no specific permission required) */
export type AdminNavItem = NavItem & { permission?: PermissionSlug }

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Inicio',        href: '/admin',             icon: <HomeIcon /> },
  { label: 'Pedidos',       href: '/admin/pedidos',      icon: <BagIcon />,        permission: 'orders:read' },
  { label: 'Pagos',         href: '/admin/pagos',        icon: <CreditCardIcon />, permission: 'payments:read' },
  { label: 'Productos',     href: '/admin/productos',    icon: <TagIcon />,        permission: 'catalog:read' },
  { label: 'Inventario',    href: '/admin/inventario',   icon: <BoxIcon />,        permission: 'inventory:read' },
  { label: 'Clientes',      href: '/admin/clientes',     icon: <UsersIcon />,      permission: 'customers:read' },
  { label: 'Contenido',     href: '/admin/contenido',    icon: <LayoutIcon />,     permission: 'cms:read' },
  { label: 'Promociones',   href: '/admin/promociones',  icon: <PercentIcon />,    permission: 'promotions:read' },
  { label: 'Delivery',      href: '/admin/delivery',     icon: <TruckIcon />,      permission: 'shipping:read' },
  { label: 'Tasas',         href: '/admin/tasas',        icon: <TrendingUpIcon />, permission: 'exchange_rates:read' },
  { label: 'Analytics',     href: '/admin/analytics',    icon: <BarChartIcon />,   permission: 'analytics:read' },
  { label: 'Usuarios',      href: '/admin/usuarios',     icon: <ShieldIcon />,     permission: 'users:read' },
  { label: 'Configuración', href: '/admin/configuracion',icon: <GearIcon />,       permission: 'settings:read' },
]
