import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://savayavzla.com'

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
  { url: `${APP_URL}/mujer`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${APP_URL}/hombre`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${APP_URL}/ninos`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${APP_URL}/zapatos`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${APP_URL}/accesorios`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${APP_URL}/nuevas-colecciones`, changeFrequency: 'daily', priority: 0.85 },
  { url: `${APP_URL}/mas-vendidos`, changeFrequency: 'daily', priority: 0.85 },
  { url: `${APP_URL}/descuentos`, changeFrequency: 'daily', priority: 0.85 },
  { url: `${APP_URL}/remates`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${APP_URL}/marcas`, changeFrequency: 'weekly', priority: 0.75 },
  { url: `${APP_URL}/sobre-nosotros`, changeFrequency: 'monthly', priority: 0.5, lastModified: new Date('2026-05-01') },
  { url: `${APP_URL}/contacto`, changeFrequency: 'monthly', priority: 0.5, lastModified: new Date('2026-05-01') },
  { url: `${APP_URL}/faq`, changeFrequency: 'monthly', priority: 0.6, lastModified: new Date('2026-05-01') },
  { url: `${APP_URL}/politica-de-envios`, changeFrequency: 'monthly', priority: 0.3, lastModified: new Date('2026-05-01') },
  { url: `${APP_URL}/politica-de-devoluciones`, changeFrequency: 'monthly', priority: 0.3, lastModified: new Date('2026-05-01') },
  { url: `${APP_URL}/terminos-y-condiciones`, changeFrequency: 'monthly', priority: 0.3, lastModified: new Date('2026-05-01') },
  { url: `${APP_URL}/politica-de-privacidad`, changeFrequency: 'monthly', priority: 0.3, lastModified: new Date('2026-05-01') },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return STATIC_PAGES
  }

  try {
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabase = await createAdminClient()

    const [
      { data: products },
      { data: brands },
      { data: collections },
    ] = await Promise.all([
      supabase
        .from('products')
        .select('slug, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('brands')
        .select('slug, created_at')
        .eq('is_active', true),
      supabase
        .from('collections')
        .select('slug, created_at')
        .eq('is_active', true),
    ])

    const productPages: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${APP_URL}/${p.slug}`,
      lastModified: new Date(p.created_at as string),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const brandPages: MetadataRoute.Sitemap = (brands ?? []).map((b) => ({
      url: `${APP_URL}/marcas/${b.slug}`,
      lastModified: new Date((b.created_at as string) ?? Date.now()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const collectionPages: MetadataRoute.Sitemap = (collections ?? []).map((c) => ({
      url: `${APP_URL}/coleccion/${c.slug}`,
      lastModified: new Date((c.created_at as string) ?? Date.now()),
      changeFrequency: 'weekly',
      priority: 0.65,
    }))

    return [...STATIC_PAGES, ...productPages, ...brandPages, ...collectionPages]
  } catch {
    return STATIC_PAGES
  }
}
