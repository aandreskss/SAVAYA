import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import PromoPopup from '@/components/home/PromoPopup'
import { WholesaleProvider } from '@/components/providers/WholesaleProvider'
import { CurrencyProvider } from '@/components/providers/CurrencyProvider'
import { createAdminClient } from '@/lib/supabase/server'
import type { PopupConfig, BannerConfig, NavBanners, StoreSettings, NavGenderEntry, NavCollection, NavBrand } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getPopup(): Promise<PopupConfig | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('popup_config')
      .select('*')
      .eq('id', 'main')
      .eq('is_active', true)
      .single()
    return (data as PopupConfig | null) ?? null
  } catch {
    return null
  }
}

async function getDisabledCategories(): Promise<string[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('category_visibility')
      .select('key, is_visible')
    return (data ?? []).filter((r) => !r.is_visible).map((r) => r.key)
  } catch {
    return []
  }
}

async function getNavBanners(): Promise<NavBanners> {
  // SAVAYA: solo calzado femenino — solo banner nav_mujer
  const empty: NavBanners = { mujer: null }
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('banner_config')
      .select('*')
      .in('id', ['nav_mujer'])
      .eq('is_active', true)
    if (!data) return empty
    const map: Record<string, BannerConfig> = {}
    for (const b of data) map[b.id] = b as BannerConfig
    return {
      mujer: map['nav_mujer'] ?? null,
    }
  } catch {
    return empty
  }
}

async function getNavCollections(): Promise<NavCollection[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('collections')
      .select('id, name, slug, nav_gender')
      .eq('is_active', true)
      .not('nav_gender', 'is', null)
    return (data ?? []) as NavCollection[]
  } catch {
    return []
  }
}

async function getNavCategories(): Promise<NavGenderEntry[]> {
  // SAVAYA: solo calzado femenino
  const GENDER_META: NavGenderEntry[] = [
    { key: 'mujer', label: 'Calzado', href: '/casuales', subcategories: [], navCollections: [], brands: [] },
  ]
  try {
    const supabase = createAdminClient()
    const [{ data: cats }, { data: prods }, navCollections, { data: brandProds }, { data: allBrands }] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, gender, product_type')
        .in('gender', ['women'])
        .eq('is_top_level', false)
        .order('order', { ascending: true }),
      supabase
        .from('products')
        .select('category_id')
        .eq('is_active', true),
      getNavCollections(),
      supabase
        .from('products')
        .select('brand_id, gender')
        .eq('is_active', true)
        .not('brand_id', 'is', null),
      supabase
        .from('brands')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('order', { ascending: true })
        .order('name', { ascending: true }),
    ])
    if (!cats) return GENDER_META

    const activeCatIds = new Set((prods ?? []).map((p: { category_id: string }) => p.category_id))

    // Build set of brand ids that have active products per gender
    const brandIdsByGender = new Map<string, Set<string>>()
    ;(brandProds ?? []).forEach((p: { brand_id: string; gender: string }) => {
      if (!brandIdsByGender.has(p.gender)) brandIdsByGender.set(p.gender, new Set())
      brandIdsByGender.get(p.gender)!.add(p.brand_id)
    })

    return GENDER_META.map((entry) => {
      // SAVAYA: solo women
      const entryGender = 'women'
      const subcategories = (cats as { id: string; name: string; slug: string; gender: string; product_type: string }[])
        .filter((c) => c.gender === entryGender && activeCatIds.has(c.id))
        .map((c) => ({ name: c.name, slug: c.slug, product_type: c.product_type ?? 'clothing' }))
      const entryNavCollections = navCollections.filter(
        (c: NavCollection & { nav_gender?: string }) =>
          c.nav_gender === entryGender || c.nav_gender === 'unisex'
      )
      const genderBrandIds = brandIdsByGender.get(entryGender) ?? new Set<string>()
      const entryBrands = (allBrands ?? [])
        .filter((b: { id: string; name: string; slug: string }) => genderBrandIds.has(b.id))
        .map((b: { id: string; name: string; slug: string }) => ({ name: b.name, slug: b.slug }))
      return { ...entry, subcategories, navCollections: entryNavCollections, brands: entryBrands }
    })
  } catch {
    return GENDER_META
  }
}

async function getNavBrands(): Promise<NavBrand[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('brands')
      .select('name, slug')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .order('name', { ascending: true })
    return (data ?? []) as NavBrand[]
  } catch {
    return []
  }
}

async function getStoreSettings(): Promise<StoreSettings | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'main')
      .single()
    return (data as StoreSettings | null) ?? null
  } catch {
    return null
  }
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [popup, disabledCategories, navBanners, settings, navCategories, navBrands] = await Promise.all([
    getPopup(),
    getDisabledCategories(),
    getNavBanners(),
    getStoreSettings(),
    getNavCategories(),
    getNavBrands(),
  ])

  const whatsappNumber = settings?.whatsapp_number ?? '584141100100'

  return (
    <CurrencyProvider currency={settings?.store_currency ?? 'EUR'}>
      <WholesaleProvider minQty={settings?.wholesale_min_qty ?? 6}>
        <Navbar disabledCategories={disabledCategories} navBanners={navBanners} whatsappNumber={whatsappNumber} navCategories={navCategories} navBrands={navBrands} />
        <div className="pb-14 md:pb-0">
          {children}
        </div>
        <Footer
          disabledCategories={disabledCategories}
          whatsappNumber={whatsappNumber}
          enabledPaymentMethods={settings?.enabled_payment_methods ?? null}
        />
        {popup && <PromoPopup config={popup} />}
        <MobileBottomNav />
      </WholesaleProvider>
    </CurrencyProvider>
  )
}
