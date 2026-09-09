import { eq, asc, desc, and, like, count } from 'drizzle-orm'
import { db } from '@/shared/lib/db'
import { pages, pageSections, pageSectionTypeEnum, banners, popups, navItems } from '@/domains/cms/schema'
import type { AdminSection, AdminBanner, AdminPopup, AdminNavItem, AdminPage } from './types'

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
  for (const item of items) {
    await db
      .update(pageSections)
      .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
      .where(eq(pageSections.id, item.id))
  }
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

export async function createSection(
  pageSlug: string,
  type: string,
  content: unknown,
  sortOrder: number,
): Promise<AdminSection> {
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.slug, pageSlug))
    .limit(1)

  if (!page) throw new Error(`Page not found: ${pageSlug}`)

  const validType = type as typeof pageSectionTypeEnum.enumValues[number]

  const [row] = await db
    .insert(pageSections)
    .values({
      pageId: page.id,
      type: validType,
      content: content as Record<string, unknown>,
      sortOrder,
      isActive: true,
    })
    .returning()

  return row as AdminSection
}

export async function deleteSection(sectionId: string): Promise<void> {
  await db.delete(pageSections).where(eq(pageSections.id, sectionId))
}

export async function upsertGenderHeroSection(
  slug: 'hombre' | 'mujer',
  content: unknown,
): Promise<void> {
  let [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1)

  if (!page) {
    const title = slug === 'hombre' ? 'Hombre' : 'Mujer'
    ;[page] = await db
      .insert(pages)
      .values({ slug, title, isActive: true })
      .returning({ id: pages.id })
  }

  const [existing] = await db
    .select({ id: pageSections.id })
    .from(pageSections)
    .where(and(eq(pageSections.pageId, page.id), eq(pageSections.type, 'hero')))
    .limit(1)

  if (existing) {
    await db
      .update(pageSections)
      .set({ content: content as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(pageSections.id, existing.id))
  } else {
    await db.insert(pageSections).values({
      pageId: page.id,
      type: 'hero',
      content: content as Record<string, unknown>,
      sortOrder: 0,
      isActive: true,
    })
  }
}

export async function getGenderHeroContent(
  slug: 'hombre' | 'mujer',
): Promise<unknown | null> {
  const [page] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1)

  if (!page) return null

  const [section] = await db
    .select({ content: pageSections.content })
    .from(pageSections)
    .where(and(eq(pageSections.pageId, page.id), eq(pageSections.type, 'hero')))
    .limit(1)

  return section?.content ?? null
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

// ---------------------------------------------------------------------------
// Nav items CRUD
// ---------------------------------------------------------------------------

export async function listAdminNavItems(): Promise<AdminNavItem[]> {
  const rows = await db
    .select({
      id: navItems.id,
      label: navItems.label,
      href: navItems.href,
      type: navItems.type,
      gender: navItems.gender,
      sortOrder: navItems.sortOrder,
      isActive: navItems.isActive,
    })
    .from(navItems)
    .orderBy(asc(navItems.sortOrder))

  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    href: r.href,
    type: r.type as 'link' | 'category_group',
    gender: (r.gender ?? null) as 'mujer' | 'hombre' | null,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }))
}

type NavItemInput = {
  label: string
  href: string | null
  type: string
  gender: string | null
  sortOrder: number
  isActive: boolean
}

export async function createAdminNavItem(data: NavItemInput): Promise<AdminNavItem> {
  const [row] = await db
    .insert(navItems)
    .values({
      label: data.label,
      href: data.href,
      type: data.type,
      gender: data.gender,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    })
    .returning()

  return {
    id: row.id,
    label: row.label,
    href: row.href,
    type: row.type as 'link' | 'category_group',
    gender: (row.gender ?? null) as 'mujer' | 'hombre' | null,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }
}

export async function updateAdminNavItem(id: string, data: NavItemInput): Promise<void> {
  await db
    .update(navItems)
    .set({
      label: data.label,
      href: data.href,
      type: data.type,
      gender: data.gender,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(navItems.id, id))
}

export async function deleteAdminNavItem(id: string): Promise<void> {
  await db.delete(navItems).where(eq(navItems.id, id))
}

export async function reorderAdminNavItems(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  for (const item of items) {
    await db
      .update(navItems)
      .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
      .where(eq(navItems.id, item.id))
  }
}

export async function toggleAdminNavItem(id: string, isActive: boolean): Promise<void> {
  await db
    .update(navItems)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(navItems.id, id))
}

// ---------------------------------------------------------------------------
// Custom pages CRUD (pages with slug starting with 'p/')
// ---------------------------------------------------------------------------

export async function listAdminCustomPages(): Promise<AdminPage[]> {
  const rows = await db
    .select({
      id: pages.id,
      slug: pages.slug,
      title: pages.title,
      isActive: pages.isActive,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .where(like(pages.slug, 'p/%'))
    .orderBy(asc(pages.createdAt))

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug.replace(/^p\//, ''),
    title: r.title,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}

export async function createAdminCustomPage(data: {
  slug: string
  title: string
}): Promise<AdminPage> {
  const fullSlug = `p/${data.slug}`
  const [row] = await db
    .insert(pages)
    .values({ slug: fullSlug, title: data.title, isActive: true })
    .returning()

  return {
    id: row.id,
    slug: data.slug,
    title: row.title,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function updateAdminCustomPageMeta(
  id: string,
  data: { title: string; isActive: boolean },
): Promise<void> {
  await db
    .update(pages)
    .set({ title: data.title, isActive: data.isActive, updatedAt: new Date() })
    .where(eq(pages.id, id))
}

export async function deleteAdminCustomPage(id: string): Promise<void> {
  await db.delete(pages).where(eq(pages.id, id))
}
