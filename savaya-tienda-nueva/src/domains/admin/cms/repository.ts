import { eq, asc, desc } from 'drizzle-orm'
import { db } from '@/shared/lib/db'
import { pages, pageSections, banners, popups } from '@/domains/cms/schema'
import type { AdminSection, AdminBanner, AdminPopup } from './types'

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function getAdminSections(pageSlug: string): Promise<AdminSection[]> {
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.slug, pageSlug))
    .limit(1)

  if (!page) return []

  const rows = await db
    .select({
      id: pageSections.id,
      type: pageSections.type,
      content: pageSections.content,
      sortOrder: pageSections.sortOrder,
      isActive: pageSections.isActive,
      updatedAt: pageSections.updatedAt,
    })
    .from(pageSections)
    .where(eq(pageSections.pageId, page.id))
    .orderBy(asc(pageSections.sortOrder))

  return rows as AdminSection[]
}

export async function updateSectionContent(
  sectionId: string,
  content: unknown,
): Promise<void> {
  await db
    .update(pageSections)
    .set({ content: content as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(pageSections.id, sectionId))
}

export async function updateSectionsOrder(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const item of items) {
      await tx
        .update(pageSections)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(pageSections.id, item.id))
    }
  })
}

export async function toggleSectionActive(
  sectionId: string,
  isActive: boolean,
): Promise<void> {
  await db
    .update(pageSections)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(pageSections.id, sectionId))
}

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

export type BannerInput = {
  title: string
  imageDesktopUrl: string
  imageMobileUrl: string
  ctaText: string | null
  ctaUrl: string | null
  isActive: boolean
  startsAt: Date | null
  endsAt: Date | null
  sortOrder: number
}

export async function listAdminBanners(): Promise<AdminBanner[]> {
  const rows = await db
    .select()
    .from(banners)
    .orderBy(asc(banners.sortOrder), desc(banners.createdAt))
  return rows as AdminBanner[]
}

export async function createAdminBanner(data: BannerInput): Promise<AdminBanner> {
  const [row] = await db
    .insert(banners)
    .values({
      title: data.title,
      imageDesktopUrl: data.imageDesktopUrl,
      imageMobileUrl: data.imageMobileUrl,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      isActive: data.isActive,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      sortOrder: data.sortOrder,
    })
    .returning()
  return row as AdminBanner
}

export async function updateAdminBanner(id: string, data: BannerInput): Promise<void> {
  await db
    .update(banners)
    .set({
      title: data.title,
      imageDesktopUrl: data.imageDesktopUrl,
      imageMobileUrl: data.imageMobileUrl,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      isActive: data.isActive,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      sortOrder: data.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(banners.id, id))
}

export async function deleteAdminBanner(id: string): Promise<void> {
  await db.delete(banners).where(eq(banners.id, id))
}

// ---------------------------------------------------------------------------
// Popups
// ---------------------------------------------------------------------------

export type PopupInput = {
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
}

export async function listAdminPopups(): Promise<AdminPopup[]> {
  const rows = await db
    .select()
    .from(popups)
    .orderBy(desc(popups.isActive), desc(popups.createdAt))
  return rows as AdminPopup[]
}

export async function createAdminPopup(data: PopupInput): Promise<AdminPopup> {
  const [row] = await db
    .insert(popups)
    .values({
      title: data.title,
      imageUrl: data.imageUrl,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      delaySeconds: data.delaySeconds,
      showOnPages: data.showOnPages,
      maxShowsPerSession: data.maxShowsPerSession,
      isActive: data.isActive,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    })
    .returning()
  return row as AdminPopup
}

export async function updateAdminPopup(id: string, data: PopupInput): Promise<void> {
  await db
    .update(popups)
    .set({
      title: data.title,
      imageUrl: data.imageUrl,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      delaySeconds: data.delaySeconds,
      showOnPages: data.showOnPages,
      maxShowsPerSession: data.maxShowsPerSession,
      isActive: data.isActive,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      updatedAt: new Date(),
    })
    .where(eq(popups.id, id))
}

export async function deleteAdminPopup(id: string): Promise<void> {
  await db.delete(popups).where(eq(popups.id, id))
}
