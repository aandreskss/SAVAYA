import type { BlockType } from '@/domains/cms/block-schemas'

export type AdminSectionType = BlockType | 'banner_row'

export type AdminSection = {
  id: string
  type: AdminSectionType
  content: unknown
  sortOrder: number
  isActive: boolean
  updatedAt: Date
}

export type AdminBanner = {
  id: string
  title: string
  imageDesktopUrl: string
  imageMobileUrl: string
  ctaText: string | null
  ctaUrl: string | null
  isActive: boolean
  startsAt: Date | null
  endsAt: Date | null
  sortOrder: number
  createdAt: Date
}

export type AdminPopup = {
  id: string
  title: string
  imageUrl: string
  ctaText: string | null
  ctaUrl: string | null
  delaySeconds: number
  showOnPages: string[] | null
  maxShowsPerSession: number
  isActive: boolean
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export const BLOCK_TYPE_LABELS: Record<AdminSectionType, string> = {
  announcement_bar: 'Barra de anuncio',
  hero: 'Hero / Banner principal',
  shop_by_category: 'Compra por categoría',
  product_carousel: 'Carrusel de productos',
  editorial_block: 'Bloque editorial',
  split_block: 'Bloque dividido',
  benefits_block: 'Beneficios',
  newsletter: 'Newsletter',
  banner_row: 'Fila de banners',
  promo_banner: 'Banner promocional',
  social_proof_grid: 'Galería social',
}
