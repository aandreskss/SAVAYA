import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.savayavzla.com'

// Static pages — always indexed, no DB needed
const STATIC_PAGES: Array<{ url: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { url: '/', priority: 1.0, changeFrequency: 'weekly' },
  { url: '/nosotros', priority: 0.7, changeFrequency: 'monthly' },
  { url: '/contacto', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/preguntas-frecuentes', priority: 0.7, changeFrequency: 'monthly' },
  { url: '/guia-de-tallas', priority: 0.8, changeFrequency: 'monthly' },
  { url: '/envios', priority: 0.7, changeFrequency: 'monthly' },
  { url: '/cambios-y-devoluciones', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/privacidad', priority: 0.3, changeFrequency: 'yearly' },
  { url: '/terminos', priority: 0.3, changeFrequency: 'yearly' },
  { url: '/tiendas', priority: 0.6, changeFrequency: 'monthly' },
  { url: '/ventas-al-mayor', priority: 0.7, changeFrequency: 'monthly' },
  { url: '/mujer', priority: 0.9, changeFrequency: 'weekly' },
  { url: '/nuevos', priority: 0.9, changeFrequency: 'daily' },
  { url: '/ofertas', priority: 0.8, changeFrequency: 'daily' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${BASE_URL}${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))

  // Dynamic entries — products and categories
  // These require DB; fall back gracefully when DATABASE_URL is absent
  let dynamicEntries: MetadataRoute.Sitemap = []

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import('@/shared/lib/db')
      const { products, categories } = await import('@/domains/catalog/schema')
      const { eq } = await import('drizzle-orm')

      const [productRows, categoryRows] = await Promise.all([
        db
          .select({ slug: products.slug, updatedAt: products.updatedAt })
          .from(products)
          .where(eq(products.isActive, true)),
        db
          .select({ slug: categories.slug })
          .from(categories)
          .where(eq(categories.isActive, true)),
      ])

      dynamicEntries = [
        ...productRows.map((p) => ({
          url: `${BASE_URL}/producto/${p.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })),
        ...categoryRows.map((c) => ({
          url: `${BASE_URL}/categoria/${c.slug}`,
          lastModified: now,
          changeFrequency: 'weekly' as const,
          priority: 0.85,
        })),
      ]
    } catch {
      // Sitemap generation must not crash the build
    }
  }

  return [...staticEntries, ...dynamicEntries]
}
