import type { Gender, ProductType, SortOption, OrderStatus } from './types'

// ─── Catalog ──────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 24

// ─── Navigation ───────────────────────────────────────────────────────────────
// Savaya = solo calzado femenino. Categorías simplificadas.

export const MAIN_NAV = [
  { label: 'Casuales', href: '/casuales' },
  { label: 'Deportivos', href: '/deportivos' },
  { label: 'De vestir', href: '/de-vestir' },
  { label: 'Nuevas colecciones', href: '/nuevas-colecciones' },
  { label: 'Descuentos', href: '/descuentos' },
  { label: 'Más vendidos', href: '/mas-vendidos' },
] as const

// ─── Genders ──────────────────────────────────────────────────────────────────
// Savaya es 100% femenino. Solo women está activo.

export const GENDERS: { value: Gender; label: string; href: string }[] = [
  { value: 'women', label: 'Mujer', href: '/casuales' },
]

// ─── Product types ────────────────────────────────────────────────────────────
// Solo calzado — sin ropa ni accesorios.

export const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: 'shoes', label: 'Zapatos' },
]

// ─── Shoe categories (Savaya-specific) ───────────────────────────────────────

export const SHOE_CATEGORIES = [
  { slug: 'casuales',       label: 'Casuales',      href: '/casuales' },
  { slug: 'deportivos',     label: 'Deportivos',     href: '/deportivos' },
  { slug: 'de-vestir',      label: 'De vestir',      href: '/de-vestir' },
] as const

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const SHOE_SIZES_WOMEN = ['35', '36', '37', '38', '39', '40'] as const

// Alias para compatibilidad con código existente que use SIZES_BY_TYPE
export const SIZES_BY_TYPE: Record<string, readonly string[]> = {
  shoes:        SHOE_SIZES_WOMEN,
  shoes_women:  SHOE_SIZES_WOMEN,
}

// ─── Colors ───────────────────────────────────────────────────────────────────

export const COLORS = [
  { name: 'Negro',       hex: '#111111' },
  { name: 'Blanco',      hex: '#FFFFFF' },
  { name: 'Gris',        hex: '#888888' },
  { name: 'Gris claro',  hex: '#D5D5D5' },
  { name: 'Nude',        hex: '#E8C9A0' },
  { name: 'Beige',       hex: '#F5F0E8' },
  { name: 'Camel',       hex: '#C19A6B' },
  { name: 'Café',        hex: '#8B4513' },
  { name: 'Rojo',        hex: '#C0392B' },
  { name: 'Rosa',        hex: '#FFB6C1' },
  { name: 'Fucsia',      hex: '#E91E8C' },
  { name: 'Azul',        hex: '#2563EB' },
  { name: 'Azul marino', hex: '#003153' },
  { name: 'Verde',       hex: '#2ECC71' },
  { name: 'Amarillo',    hex: '#F1C40F' },
  { name: 'Naranja',     hex: '#E67E22' },
  { name: 'Morado',      hex: '#8E44AD' },
  { name: 'Dorado',      hex: '#CA8C31' },
  { name: 'Plateado',    hex: '#C0C0C0' },
] as const

// ─── Sort options ─────────────────────────────────────────────────────────────

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Más recientes' },
  { value: 'featured',   label: 'Destacados' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]

// ─── Order statuses ───────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'Pendiente',
  paid:       'Pagado',
  processing: 'En preparación',
  shipped:    'Enviado',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
  returned:   'Devuelto',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  paid:       'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
  returned:   'bg-gray-100 text-gray-800',
}

// ─── Venezuela — ciudades con cobertura Savaya ────────────────────────────────

export const SAVAYA_CITIES = [
  'Caracas', 'Valencia', 'Maracay', 'Barquisimeto', 'Puerto La Cruz',
  'Puerto Ordaz', 'Barinas', 'San Cristóbal', 'Mérida', 'Maracaibo',
  'Acarigua', 'San Félix', 'Guanare', 'El Tigre', 'Cantaura',
  'Puerto Cabello', 'Valera', 'Trujillo', 'Maturín', 'Upata', 'Valle la Pascua',
] as const

// ─── Brand info ───────────────────────────────────────────────────────────────

export const BRAND = {
  name:       'Savaya',
  tagline:    'Marca tu moda',
  whatsapp:   '584141100100',
  email:      'Savayarrss@gmail.com',
  instagram:  '@Savayavzla',
  address:    'Calle 73, CC Multi Tienda God is Good, local A-4, Valencia, Carabobo',
  metaPixelId: '27355395054120748',
} as const
