import { eq, and, lte, gte, or, isNull, asc, inArray } from 'drizzle-orm'

export type GenderHero = {
  imageDesktopUrl: string
  overlayOpacity: number
  ctaPrimaryText: string
  ctaPrimaryHref: string
  ctaSecondaryText: string | null
  ctaSecondaryHref: string | null
}
import { db } from '@/shared/lib/db'
import { pages, pageSections, banners, popups, navItems } from './schema'
import { categories } from '@/domains/catalog/schema'
import type { BlockType } from './block-schemas'
import type { NavCategory } from '@/domains/catalog/nav-config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PageSection = {
  id: string
  type: BlockType
  content: unknown
  sortOrder: number
}

export type Banner = {
  id: string
  title: string
  imageDesktopUrl: string
  imageMobileUrl: string
  ctaText: string | null
  ctaUrl: string | null
  sortOrder: number
}

export type ActivePopup = {
  id: string
  imageUrl: string
  ctaText: string | null
  ctaUrl: string | null
  delaySeconds: number
  showOnPages: string[] | null
  maxShowsPerSession: number
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Dev fallback — used when DATABASE_URL is absent or the query fails
// ---------------------------------------------------------------------------

const DEV_FALLBACK_SECTIONS: PageSection[] = [
  {
    id: 'dev-announcement',
    type: 'announcement_bar',
    content: {
      text: 'Envíos a todo Venezuela desde Valencia, Carabobo. ¡Conócenos!',
      linkText: 'Ver más',
      linkHref: '/nosotros',
      bgColor: 'brand-black',
    },
    sortOrder: 0,
  },
  {
    id: 'dev-hero',
    type: 'hero',
    content: {
      headline: 'Marca tu moda',
      subheadline: 'Calzado femenino venezolano. Tallas 35 al 40.',
      ctaPrimaryText: 'Ver colección',
      ctaPrimaryHref: '/coleccion',
      ctaSecondaryText: 'Novedades',
      ctaSecondaryHref: '/nuevo',
      imageDesktopUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1920&q=80',
      imageMobileUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=768&q=80',
      imageAlt: 'Colección SAVAYA — calzado femenino venezolano',
      overlayOpacity: 0.35,
    },
    sortOrder: 1,
  },
  {
    id: 'dev-gender-split',
    type: 'split_block',
    content: {
      leftLabel: 'Mujer',
      leftHref: '/mujer',
      leftImageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
      rightLabel: 'Hombre',
      rightHref: '/hombre',
      rightImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    },
    sortOrder: 2,
  },
  {
    id: 'dev-categories',
    type: 'shop_by_category',
    content: {
      title: 'Compra por categoría',
      categories: [
        {
          name: 'Sandalias',
          slug: 'sandalias',
          imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80',
        },
        {
          name: 'Tacones',
          slug: 'tacones',
          imageUrl: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&q=80',
        },
        {
          name: 'Plataformas',
          slug: 'plataformas',
          imageUrl: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80',
        },
        {
          name: 'Flats',
          slug: 'flats',
          imageUrl: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80',
        },
      ],
    },
    sortOrder: 4,
  },
  {
    id: 'dev-benefits',
    type: 'benefits_block',
    content: {
      benefits: [
        {
          icon: 'truck',
          title: 'Envíos a todo Venezuela',
          description: 'Despachamos por Zoom, Tealca y MRW desde Valencia, Carabobo.',
        },
        {
          icon: 'whatsapp',
          title: 'Atención por WhatsApp',
          description: 'Respuesta rápida de lunes a sábado de 9 am a 6 pm.',
        },
        {
          icon: 'refresh',
          title: 'Cambios en 7 días',
          description: 'Si el calzado no es tu talla, realizamos el cambio sin costo adicional.',
        },
        {
          icon: 'shield',
          title: 'Compra segura',
          description: 'Múltiples métodos de pago verificados. Tu pedido está protegido.',
        },
      ],
    },
    sortOrder: 3,
  },
]

// ---------------------------------------------------------------------------
// Repository functions
// ---------------------------------------------------------------------------

/**
 * Fetches active page sections for the home page, ordered by sortOrder ASC.
 * Falls back to DEV_FALLBACK_SECTIONS if DATABASE_URL is missing or the query
 * fails (e.g. no DB connection in local dev without credentials).
 */
export async function getHomePageSections(): Promise<PageSection[]> {
  if (!process.env.DATABASE_URL) {
    return DEV_FALLBACK_SECTIONS
  }

  try {
    const homePage = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.slug, 'home'), eq(pages.isActive, true)))
      .limit(1)

    if (homePage.length === 0) {
      console.warn('[cms/repository] No home page found in DB — using dev fallback')
      return DEV_FALLBACK_SECTIONS
    }

    const rows = await db
      .select({
        id: pageSections.id,
        type: pageSections.type,
        content: pageSections.content,
        sortOrder: pageSections.sortOrder,
      })
      .from(pageSections)
      .where(
        and(
          eq(pageSections.pageId, homePage[0].id),
          eq(pageSections.isActive, true),
        ),
      )
      .orderBy(asc(pageSections.sortOrder))

    return rows as PageSection[]
  } catch (error) {
    console.error('[cms/repository] getHomePageSections failed — using dev fallback:', error)
    return DEV_FALLBACK_SECTIONS
  }
}

/**
 * Fetches the active announcement_bar section for the home page.
 * Used by the shop layout to render it above the sticky navbar on all pages.
 * Returns null if no active announcement bar is found.
 */
export async function getAnnouncementBarSection(): Promise<PageSection | null> {
  if (!process.env.DATABASE_URL) {
    return DEV_FALLBACK_SECTIONS.find((s) => s.type === 'announcement_bar') ?? null
  }

  try {
    const homePage = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.slug, 'home'), eq(pages.isActive, true)))
      .limit(1)

    if (!homePage[0]) return null

    const rows = await db
      .select({
        id: pageSections.id,
        type: pageSections.type,
        content: pageSections.content,
        sortOrder: pageSections.sortOrder,
      })
      .from(pageSections)
      .where(
        and(
          eq(pageSections.pageId, homePage[0].id),
          eq(pageSections.isActive, true),
          eq(pageSections.type, 'announcement_bar'),
        ),
      )
      .limit(1)

    return (rows[0] as PageSection) ?? null
  } catch {
    return null
  }
}

/**
 * Fetches the hero section for /hombre or /mujer from the DB.
 * Returns null if the page/section hasn't been configured yet (storefront uses hardcoded fallback).
 */
export async function getGenderHeroSection(slug: 'hombre' | 'mujer'): Promise<GenderHero | null> {
  if (!process.env.DATABASE_URL) return null

  try {
    const [page] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.slug, slug), eq(pages.isActive, true)))
      .limit(1)

    if (!page) return null

    const [section] = await db
      .select({ content: pageSections.content })
      .from(pageSections)
      .where(
        and(
          eq(pageSections.pageId, page.id),
          eq(pageSections.isActive, true),
          eq(pageSections.type, 'hero'),
        ),
      )
      .limit(1)

    return section ? (section.content as GenderHero) : null
  } catch (error) {
    console.error(`[cms/repository] getGenderHeroSection(${slug}) failed:`, error)
    return null
  }
}

/**
 * Fetches active banners whose active window includes `now`.
 * A null endsAt means the banner runs indefinitely from startsAt.
 */
export async function getBanners(now: Date): Promise<Banner[]> {
  if (!process.env.DATABASE_URL) return []

  try {
    const rows = await db
      .select({
        id: banners.id,
        title: banners.title,
        imageDesktopUrl: banners.imageDesktopUrl,
        imageMobileUrl: banners.imageMobileUrl,
        ctaText: banners.ctaText,
        ctaUrl: banners.ctaUrl,
        sortOrder: banners.sortOrder,
      })
      .from(banners)
      .where(
        and(
          eq(banners.isActive, true),
          lte(banners.startsAt, now),
          or(isNull(banners.endsAt), gte(banners.endsAt!, now)),
        ),
      )
      .orderBy(asc(banners.sortOrder))

    return rows
  } catch {
    return []
  }
}

/**
 * Fetches the first active popup whose date window includes `now`.
 * Returns null if none is active.
 */
export async function getActivePopup(now: Date): Promise<ActivePopup | null> {
  if (!process.env.DATABASE_URL) return null

  try {
    const rows = await db
      .select({
        id: popups.id,
        imageUrl: popups.imageUrl,
        ctaText: popups.ctaText,
        ctaUrl: popups.ctaUrl,
        delaySeconds: popups.delaySeconds,
        showOnPages: popups.showOnPages,
        maxShowsPerSession: popups.maxShowsPerSession,
        updatedAt: popups.updatedAt,
      })
      .from(popups)
      .where(
        and(
          eq(popups.isActive, true),
          or(isNull(popups.startsAt), lte(popups.startsAt!, now)),
          or(isNull(popups.endsAt), gte(popups.endsAt!, now)),
        ),
      )
      .limit(1)

    return rows[0] ?? null
  } catch (error) {
    console.error('[cms/repository] getActivePopup failed:', error)
    return null
  }
}

// ---------------------------------------------------------------------------
// Custom pages (/p/[slug]) — sections for a specific page by slug
// ---------------------------------------------------------------------------

/**
 * Fetches active sections for any page by its DB slug (e.g. 'p/nuevos').
 * Returns null if the page doesn't exist or is inactive (triggers 404 in storefront).
 */
export async function getCustomPageSections(slug: string): Promise<PageSection[] | null> {
  if (!process.env.DATABASE_URL) return []

  try {
    const [page] = await db
      .select({ id: pages.id })
      .from(pages)
      .where(and(eq(pages.slug, slug), eq(pages.isActive, true)))
      .limit(1)

    if (!page) return null

    const rows = await db
      .select({
        id: pageSections.id,
        type: pageSections.type,
        content: pageSections.content,
        sortOrder: pageSections.sortOrder,
      })
      .from(pageSections)
      .where(and(eq(pageSections.pageId, page.id), eq(pageSections.isActive, true)))
      .orderBy(asc(pageSections.sortOrder))

    return rows as PageSection[]
  } catch (error) {
    console.error(`[cms/repository] getCustomPageSections(${slug}) failed:`, error)
    return null
  }
}

// ---------------------------------------------------------------------------
// Dynamic navbar — builds NavCategory[] from nav_items + DB categories
// ---------------------------------------------------------------------------

export async function buildNavCategories(): Promise<NavCategory[]> {
  if (!process.env.DATABASE_URL) {
    return [
      { label: 'Mujer', href: '/mujer' },
      { label: 'Hombre', href: '/hombre' },
      { label: 'Nuevos', href: '/nuevos' },
      { label: 'Ofertas', href: '/ofertas' },
    ]
  }

  try {
    const items = await db
      .select({
        id: navItems.id,
        label: navItems.label,
        href: navItems.href,
        type: navItems.type,
        gender: navItems.gender,
        sortOrder: navItems.sortOrder,
      })
      .from(navItems)
      .where(eq(navItems.isActive, true))
      .orderBy(asc(navItems.sortOrder))

    // Fetch all categories needed for category_group items in one query
    const genderGroups = items
      .filter((i) => i.type === 'category_group' && i.gender)
      .map((i) => i.gender as string)

    let catRows: { name: string; slug: string; gender: string }[] = []
    if (genderGroups.length > 0) {
      catRows = await db
        .select({ name: categories.name, slug: categories.slug, gender: categories.gender })
        .from(categories)
        .where(
          and(
            eq(categories.isActive, true),
            or(
              inArray(categories.gender, genderGroups),
              eq(categories.gender, 'unisex'),
            ),
          ),
        )
        .orderBy(asc(categories.sortOrder), asc(categories.name))
    }

    return items.map((item): NavCategory => {
      if (item.type === 'category_group' && item.gender) {
        const subs = catRows
          .filter((c) => c.gender === item.gender || c.gender === 'unisex')
          .map((c) => ({ name: c.name, href: `/categoria/${c.slug}` }))

        return {
          label: item.label,
          href: item.href ?? `/${item.gender}`,
          subcategories: subs.length > 0 ? subs : undefined,
        }
      }

      return {
        label: item.label,
        href: item.href ?? '/',
      }
    })
  } catch (error) {
    console.error('[cms/repository] buildNavCategories failed:', error)
    return []
  }
}
