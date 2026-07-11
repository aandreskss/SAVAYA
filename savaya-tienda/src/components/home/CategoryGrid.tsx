import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import CloudinaryImage from '@/components/ui/CloudinaryImage'

interface CategoryItem {
  id: string
  slug: string
  name: string
  image_url: string | null
  product_type?: string | null
  href?: string
}

// SAVAYA: shoes use their own slug as route (e.g. casuales, deportivos, de-vestir)
// clothing/accessories kept for future-proofing but won't appear in Savaya catalog
const TYPE_ROUTES: Record<string, string> = {
  clothing: 'ropa',
  accessories: 'accesorios',
  // shoes intentionally omitted — each category slug is its own route
}

// Grid classes — full width, no centering constraint
const COUNT_GRID: Record<number, string> = {
  1: 'grid-cols-1 max-w-xs mx-auto',
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
}

export function CategoryGridSkeleton() {
  return (
    <section className="py-16">
      <div className="px-4 md:px-8">
        <div className="h-7 w-52 bg-gray-bg rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-3xl bg-gray-bg animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function CategoryGrid() {
  let categories: CategoryItem[] = []

  try {
    const supabase = createAdminClient()

    const [{ data: cats, error: catsError }, { data: visibility }] = await Promise.all([
      supabase
        .from('categories')
        .select('id, slug, name, image_url, product_type')
        .is('parent_id', null)
        .not('product_type', 'is', null)
        .order('order', { ascending: true }),
      supabase
        .from('category_visibility')
        .select('key, is_visible'),
    ])

    if (!catsError && cats && cats.length > 0) {
      type RawCat = { id: string; slug: string; name: string; image_url: string | null; product_type: string | null; href?: string }

      const disabledSlugs = new Set(
        (visibility ?? [])
          .filter((r: { key: string; is_visible: boolean }) => !r.is_visible)
          .map((r: { key: string }) => r.key)
      )

      const filtered = (cats as RawCat[]).filter((cat) => !disabledSlugs.has(cat.slug))

      if (filtered.length > 0) {
        categories = filtered.map((cat) => ({
          ...cat,
          // For shoes, use the category slug directly (casuales, deportivos, de-vestir)
          href: cat.product_type && TYPE_ROUTES[cat.product_type]
            ? `/${TYPE_ROUTES[cat.product_type]}`
            : `/${cat.slug}`,
        }))
      }
    }
  } catch {
    // Fall back silently
  }

  if (categories.length === 0) return null

  const gridClass = COUNT_GRID[categories.length] ?? COUNT_GRID[5]

  return (
    <section className="py-16 overflow-hidden">
      <div className="px-4 md:px-8">

        {/* Header */}
        <div className="mb-8 md:mb-10">
          <p className="font-heading text-[10px] tracking-[0.3em] uppercase text-gold mb-2">
            Explora
          </p>
          <h2 className="font-display text-2xl md:text-3xl text-black">
            Compra por categoría
          </h2>
        </div>

        <div className={`grid ${gridClass} gap-4 md:gap-5`}>
          {categories.map(({ id, slug, name, image_url, href }) => (
            <Link
              key={id}
              href={href ?? `/${slug}`}
              className="group relative block overflow-hidden rounded-3xl aspect-[4/5] bg-gray-bg"
            >
              {/* Image */}
              {image_url && (
                <CloudinaryImage
                  src={image_url}
                  alt={name}
                  fill
                  quality={90}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Top accent line */}
              <div className="absolute top-5 left-5 w-6 h-0.5 bg-gold opacity-75" />

              {/* Text */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                <h3 className="font-display text-xl md:text-2xl font-bold text-white leading-tight mb-4">
                  {name}
                </h3>
                <span className="inline-flex items-center gap-1.5 self-start font-heading font-semibold text-[10px] tracking-[0.15em] uppercase text-white bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-2 rounded-full group-hover:bg-white group-hover:text-black group-hover:border-white transition-all duration-300">
                  Explorar
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-0.5">
                    <line x1="2" y1="6" x2="10" y2="6" /><polyline points="7 3 10 6 7 9" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
