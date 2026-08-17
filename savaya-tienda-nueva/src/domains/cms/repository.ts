import { eq, and, lte, gte, or, isNull, asc } from 'drizzle-orm'
import { db } from '@/shared/lib/db'
import { pages, pageSections, banners } from './schema'
import type { BlockType } from './block-schemas'

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
 * Fetches active banners whose active window includes `now`.
 * A null endsAt means the banner runs indefinitely from startsAt.
 */
export async function getBanners(now: Date): Promise<Banner[]> {
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
}
