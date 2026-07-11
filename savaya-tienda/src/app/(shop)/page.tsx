import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

export const metadata: Metadata = {
  title: 'Savaya — Calzado femenino | Marca tu moda',
  description:
    'Tienda online de zapatos para mujer. Casuales, deportivos y de vestir. Paga con Zelle, Binance, USDT o transferencia. Envíos a todo Venezuela.',
  alternates: { canonical: APP_URL },
  openGraph: {
    title: 'Savaya — Calzado femenino | Marca tu moda',
    description: 'Zapatos casuales, deportivos y de vestir para mujer. Zelle · Binance · USDT · Pago móvil. Envíos a todo Venezuela.',
    url: APP_URL,
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Savaya — Calzado femenino venezolano' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Savaya — Calzado femenino | Marca tu moda',
    description: 'Zapatos para mujer. Paga con Zelle, Binance o USDT. Envíos a todo Venezuela.',
    images: ['/og-default.jpg'],
  },
}
import type { BannerConfig, Product, CustomSectionData } from '@/lib/types'
import HeroBanner, { type HeroSlide } from '@/components/home/HeroBanner'
import ValueProps from '@/components/home/ValueProps'
import CategoryGrid, { CategoryGridSkeleton } from '@/components/home/CategoryGrid'
import PromoBannerFull from '@/components/home/PromoBannerFull'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import PromoBanners from '@/components/home/PromoBanners'
import NewArrivals from '@/components/home/NewArrivals'
import SaleProducts from '@/components/home/SaleProducts'
import FeaturedCollection from '@/components/home/FeaturedCollection'
import CustomSection from '@/components/home/CustomSection'
import RecentlyViewed from '@/components/home/RecentlyViewed'

const DEFAULT_FULL_1 = {
  label: 'Ofertas especiales',
  title: 'Hasta 50% OFF en descuentos',
  subtitle: 'Los modelos más buscados de la temporada a precios increíbles. ¡Solo por tiempo limitado!',
  cta: 'Ver descuentos',
  href: '/descuentos',
  imageUrl: undefined,
  align: 'left' as const,
  accent: 'gold' as const,
}

const DEFAULT_FULL_2 = {
  label: 'Nueva colección',
  title: 'Marca tu moda esta temporada',
  subtitle: 'Casuales, deportivos y de vestir — zapatos diseñados para la mujer venezolana.',
  cta: 'Ver colección',
  href: '/nuevas-colecciones',
  imageUrl: undefined,
  align: 'center' as const,
  accent: 'white' as const,
}

// ─── Data fetchers ─────────────────────────────────────────────────────────────

async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (!data || data.length === 0) return []
    return data.map(s => ({
      id: s.id as string,
      eyebrow: (s.eyebrow as string) ?? '',
      title: (s.title as string) ?? '',
      description: (s.description as string) || undefined,
      cta: (s.cta as string) ?? '',
      href: (s.href as string) ?? '',
      cta2: (s.cta2 as string) || undefined,
      href2: (s.href2 as string) || undefined,
      imageUrl: (s.image_url as string) || undefined,
      mobileImageUrl: (s.mobile_image_url as string) || undefined,
      imageHref: (s.image_href as string) || undefined,
      accent: ((s.accent as string) === 'sale' ? 'sale' : 'gold') as 'sale' | 'gold',
    }))
  } catch {
    return []
  }
}

async function getHomeBanners(): Promise<{
  full1: BannerConfig | null
  full2: BannerConfig | null
  dualMujer: BannerConfig | null
  dualCasual: BannerConfig | null
}> {
  const empty = { full1: null, full2: null, dualMujer: null, dualCasual: null }
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('banner_config')
      .select('*')
      .in('id', ['home_full_1', 'home_full_2', 'home_dual_mujer', 'home_dual_casual'])
    if (!data) return empty
    const map: Record<string, BannerConfig> = {}
    for (const b of data) map[b.id] = b as BannerConfig
    return {
      full1: map['home_full_1'] ?? null,
      full2: map['home_full_2'] ?? null,
      dualMujer: map['home_dual_mujer'] ?? null,
      dualCasual: map['home_dual_casual'] ?? null,
    }
  } catch {
    return empty
  }
}

async function getCustomSections(): Promise<CustomSectionData[]> {
  try {
    const supabase = createAdminClient()
    const { data: sections } = await supabase
      .from('custom_sections')
      .select('id, slot, title, is_active')
      .eq('is_active', true)
      .order('slot', { ascending: true })

    if (!sections || sections.length === 0) return []

    const sectionIds = sections.map((s) => s.id as string)
    const { data: cards } = await supabase
      .from('custom_section_cards')
      .select('id, section_id, label, image_url, href, display_order')
      .in('section_id', sectionIds)
      .order('display_order', { ascending: true })

    return sections.map((s) => ({
      id: s.id as string,
      slot: s.slot as number,
      title: (s.title as string | null),
      is_active: true,
      cards: ((cards ?? []) as Array<{
        id: string; section_id: string; label: string
        image_url: string | null; href: string; display_order: number
      }>)
        .filter((c) => c.section_id === s.id)
        .map((c) => ({
          id: c.id,
          section_id: c.section_id,
          label: c.label,
          image_url: c.image_url,
          href: c.href,
          display_order: c.display_order,
        })),
    }))
  } catch {
    return []
  }
}

async function attachVariants(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  products: Product[],
): Promise<Product[]> {
  if (!products.length) return []
  const { data: variantRows } = await supabase
    .from('product_variants')
    .select('*')
    .in('product_id', products.map(p => p.id))
  const byProduct = new Map<string, Product['variants']>()
  for (const v of variantRows ?? []) {
    const vt = v as { product_id: string }
    if (!byProduct.has(vt.product_id)) byProduct.set(vt.product_id, [])
    byProduct.get(vt.product_id)!.push(v as never)
  }
  return products.map(p => ({ ...p, variants: byProduct.get(p.id) ?? [] }))
}

async function attachColorImages(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  products: Product[],
): Promise<Product[]> {
  if (!products.length) return products
  const { data: rows } = await supabase
    .from('product_color_images')
    .select('product_id, color, color_hex, images')
    .in('product_id', products.map(p => p.id))
  const byProduct = new Map<string, Product['color_images']>()
  for (const r of rows ?? []) {
    const row = r as { product_id: string; color: string; color_hex: string; images: string[] }
    if (!byProduct.has(row.product_id)) byProduct.set(row.product_id, [])
    byProduct.get(row.product_id)!.push({ id: '', ...row })
  }
  return products.map(p => ({ ...p, color_images: byProduct.get(p.id) ?? [] }))
}

async function getHomeProducts(): Promise<{
  featured: Product[]
  newArrivals: Product[]
  sale: Product[]
}> {
  try {
    const supabase = createAdminClient()

    // ── "Los más vendidos": manually featured + top sellers by order volume ──
    const [{ data: featuredRaw }, { data: orderItemsRaw }] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(10),
      // Get variant_id sales counts from order_items
      supabase
        .from('order_items')
        .select('variant_id')
        .not('variant_id', 'is', null),
    ])

    const featuredProducts = (featuredRaw ?? []) as Product[]

    // Build top-selling product IDs from order_items → product_variants
    let topSellerProducts: Product[] = []
    const orderItems = (orderItemsRaw ?? []) as { variant_id: string }[]
    if (orderItems.length > 0) {
      // Count by variant
      const variantCounts = new Map<string, number>()
      for (const row of orderItems) {
        variantCounts.set(row.variant_id, (variantCounts.get(row.variant_id) ?? 0) + 1)
      }
      const topVariantIds = [...variantCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([id]) => id)

      // Resolve to product IDs
      const { data: topVariants } = await supabase
        .from('product_variants')
        .select('product_id')
        .in('id', topVariantIds)

      const seen = new Set(featuredProducts.map(p => p.id))
      const topProductIds: string[] = []
      for (const v of topVariants ?? []) {
        const vt = v as { product_id: string }
        if (!seen.has(vt.product_id)) {
          seen.add(vt.product_id)
          topProductIds.push(vt.product_id)
          if (topProductIds.length >= 10) break
        }
      }

      if (topProductIds.length > 0) {
        const { data: topRaw } = await supabase
          .from('products')
          .select('*')
          .in('id', topProductIds)
          .eq('is_active', true)
        topSellerProducts = (topRaw ?? []) as Product[]
      }
    }

    const allFeatured = [...featuredProducts, ...topSellerProducts].slice(0, 10)

    // ── Nuevos ingresos ──
    const { data: newRaw } = await supabase
      .from('products')
      .select('*')
      .eq('is_new', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(12)

    // ── Ofertas de la semana ──
    const { data: saleRaw } = await supabase
      .from('products')
      .select('*')
      .not('sale_price', 'is', null)
      .eq('is_active', true)
      .limit(10)

    const [featuredWithV, newWithV, saleWithV] = await Promise.all([
      attachVariants(supabase, allFeatured),
      attachVariants(supabase, (newRaw ?? []) as Product[]),
      attachVariants(supabase, (saleRaw ?? []) as Product[]),
    ])

    const [featured, newArrivals, sale] = await Promise.all([
      attachColorImages(supabase, featuredWithV),
      attachColorImages(supabase, newWithV),
      attachColorImages(supabase, saleWithV),
    ])

    return { featured, newArrivals, sale }
  } catch {
    return { featured: [], newArrivals: [], sale: [] }
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [heroSlides, banners, homeProducts, customSections] = await Promise.all([
    getHeroSlides(),
    getHomeBanners(),
    getHomeProducts(),
    getCustomSections(),
  ])

  const customSlot1 = customSections.find((s) => s.slot === 1)
  const customSlot2 = customSections.find((s) => s.slot === 2)
  const customSlot3 = customSections.find((s) => s.slot === 3)

  const full1 = banners.full1
  const full2 = banners.full2

  return (
    <main>
      <HeroBanner slides={heroSlides.length > 0 ? heroSlides : undefined} />
      <ValueProps />
      <Suspense fallback={<CategoryGridSkeleton />}>
        <CategoryGrid />
      </Suspense>

      <PromoBannerFull
        label={full1?.badge ?? DEFAULT_FULL_1.label}
        title={full1?.title ?? DEFAULT_FULL_1.title}
        subtitle={full1?.subtitle ?? DEFAULT_FULL_1.subtitle}
        cta={full1?.cta_text ?? DEFAULT_FULL_1.cta}
        href={full1?.href ?? DEFAULT_FULL_1.href}
        imageUrl={full1?.image_url ?? DEFAULT_FULL_1.imageUrl}
        align={DEFAULT_FULL_1.align}
        accent={DEFAULT_FULL_1.accent}
        imageOnly={full1?.image_only ?? false}
      />

      <FeaturedProducts products={homeProducts.featured} />

      <PromoBanners
        dualMujer={banners.dualMujer}
        dualCasual={banners.dualCasual}
      />

      {customSlot1 && customSlot1.cards.length > 0 && (
        <CustomSection title={customSlot1.title} cards={customSlot1.cards} />
      )}

      <FeaturedCollection />

      <PromoBannerFull
        label={full2?.badge ?? DEFAULT_FULL_2.label}
        title={full2?.title ?? DEFAULT_FULL_2.title}
        subtitle={full2?.subtitle ?? DEFAULT_FULL_2.subtitle}
        cta={full2?.cta_text ?? DEFAULT_FULL_2.cta}
        href={full2?.href ?? DEFAULT_FULL_2.href}
        imageUrl={full2?.image_url ?? DEFAULT_FULL_2.imageUrl}
        align={DEFAULT_FULL_2.align}
        accent={DEFAULT_FULL_2.accent}
        imageOnly={full2?.image_only ?? false}
      />

      {customSlot2 && customSlot2.cards.length > 0 && (
        <CustomSection title={customSlot2.title} cards={customSlot2.cards} />
      )}

      <NewArrivals products={homeProducts.newArrivals} />

      {customSlot3 && customSlot3.cards.length > 0 && (
        <CustomSection title={customSlot3.title} cards={customSlot3.cards} />
      )}

      <SaleProducts products={homeProducts.sale} />
      <RecentlyViewed />
    </main>
  )
}
