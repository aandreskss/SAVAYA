import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

// ─── Category / style hints ───────────────────────────────────────────────────
// keywords are normalized (no accents, lowercase). Matched if the query
// *includes* the keyword or the keyword *starts with* the first 4 chars of query.

const CATEGORY_HINTS = [
  // ── Main categories ──────────────────────────────────────────────────────
  {
    label: 'Mujer',
    href: '/mujer',
    keywords: ['mujer', 'femenin', 'dama', 'ella', 'blusa', 'vestido', 'falda', 'crop', 'top'],
  },
  {
    label: 'Hombre',
    href: '/hombre',
    keywords: ['hombre', 'masculin', 'caballero', 'el', 'camisa', 'pantalon', 'chaqueta', 'polo'],
  },
  {
    label: 'Niños',
    href: '/ninos',
    keywords: ['nino', 'nina', 'infantil', 'kids', 'pequen', 'bebe', 'junior', 'escolar'],
  },
  {
    label: 'Zapatos',
    href: '/zapatos',
    keywords: ['zapato', 'zapatilla', 'tenis', 'sandalia', 'bota', 'tacon', 'calzado', 'mocasin', 'flat', 'loafer', 'sneaker'],
  },
  {
    label: 'Accesorios',
    href: '/accesorios',
    keywords: ['accesorio', 'bolso', 'cartera', 'joyeria', 'gorra', 'cinturon', 'collar', 'pulsera', 'anillo', 'aretes', 'mochila', 'billetera'],
  },
  {
    label: 'Nuevas Colecciones',
    href: '/nuevas-colecciones',
    keywords: ['nuevo', 'nueva', 'coleccion', 'reciente', 'temporada', 'tendencia', 'trend', 'lanzamiento'],
  },
  {
    label: 'Descuentos',
    href: '/descuentos',
    keywords: ['descuento', 'oferta', 'rebaja', 'sale', 'barato', 'economico', 'precio'],
  },
  {
    label: 'Remates',
    href: '/remates',
    keywords: ['remate', 'liquidacion', 'promocion', 'ultimas', 'ultimo', 'clearance'],
  },

  // ── Style / occasion ─────────────────────────────────────────────────────
  {
    label: 'Estilo deportivo',
    href: '/zapatos',
    keywords: ['deportiv', 'sport', 'running', 'gym', 'atletico', 'athletic', 'correr', 'entrena', 'fitness', 'activ'],
  },
  {
    label: 'Ropa casual',
    href: '/mujer',
    keywords: ['casual', 'informal', 'diario', 'cotidian', 'comodo', 'relax', 'everyday'],
  },
  {
    label: 'Estilo formal',
    href: '/hombre',
    keywords: ['formal', 'elegante', 'oficina', 'trabajo', 'traje', 'sastre', 'ejecutiv', 'profesional', 'negocios'],
  },
  {
    label: 'Looks de fiesta',
    href: '/mujer',
    keywords: ['fiesta', 'noche', 'coctel', 'gala', 'evento', 'celebracion', 'boda', 'quincea', 'graduacion'],
  },
  {
    label: 'Moda de verano',
    href: '/nuevas-colecciones',
    keywords: ['verano', 'summer', 'playa', 'calor', 'fresco', 'tropical', 'vacacion'],
  },
  {
    label: 'Ropa de invierno',
    href: '/nuevas-colecciones',
    keywords: ['invierno', 'winter', 'frio', 'abrigo', 'sueter', 'jersey', 'bufanda', 'lana'],
  },
  {
    label: 'Moda primavera',
    href: '/nuevas-colecciones',
    keywords: ['primavera', 'spring', 'floral', 'pastel', 'liviano'],
  },
  {
    label: 'Streetwear',
    href: '/nuevas-colecciones',
    keywords: ['street', 'urbano', 'urban', 'hype', 'oversize', 'hoodie', 'sudadera'],
  },
  {
    label: 'Tenis de lujo',
    href: '/zapatos',
    keywords: ['lujo', 'luxury', 'premium', 'gucci', 'louis', 'prada', 'designer', 'marca', 'exclusiv'],
  },
  {
    label: 'Botas y botines',
    href: '/zapatos',
    keywords: ['bota', 'botin', 'ankle', 'chelsea', 'combat'],
  },
  {
    label: 'Sandalias',
    href: '/zapatos',
    keywords: ['sandalia', 'ojota', 'chancleta', 'flip', 'plataforma', 'cuña', 'cuna'],
  },
  {
    label: 'Bolsos y carteras',
    href: '/accesorios',
    keywords: ['bolso', 'cartera', 'clutch', 'tote', 'shopper', 'crossbody', 'mini bag'],
  },
  {
    label: 'Ropa de niña',
    href: '/ninos',
    keywords: ['nina', 'girl', 'princesa', 'rosa', 'tutú', 'tutu', 'lazos'],
  },
  {
    label: 'Ropa de niño',
    href: '/ninos',
    keywords: ['nino', 'boy', 'short', 'bermuda', 'uniforme'],
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchProductResult {
  id: string
  name: string
  slug: string
  base_price: number
  sale_price: number | null
  images: string[]
}

export interface SearchApiResponse {
  products: SearchProductResult[]
  categories: { label: string; href: string }[]
}

// ─── Normalize helper ─────────────────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!rateLimit(`search:${getClientIp(request)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas búsquedas. Intenta en un momento.' }, { status: 429 })
  }

  const term = (request.nextUrl.searchParams.get('q') ?? '').trim()

  if (term.length < 1) {
    return NextResponse.json({ products: [], categories: [] } satisfies SearchApiResponse)
  }

  const normalized = normalize(term)

  // Category hints: match if query includes the keyword or keyword starts with query (prefix)
  const categories = CATEGORY_HINTS.filter(({ keywords }) =>
    keywords.some((kw) => {
      const nkw = normalize(kw)
      return nkw.includes(normalized) || normalized.includes(nkw) || nkw.startsWith(normalized.slice(0, 5))
    }),
  ).slice(0, 4)

  let products: SearchProductResult[] = []

  // ── Mock (no Supabase) ────────────────────────────────────────────────────
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { FEATURED_PRODUCTS, NEW_ARRIVALS, SALE_PRODUCTS } = await import('@/lib/mock-data')
    const all = [...FEATURED_PRODUCTS, ...NEW_ARRIVALS, ...SALE_PRODUCTS].filter(
      (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
    )
    const lower = term.toLowerCase()
    products = all
      .filter((p) =>
        p.name.toLowerCase().startsWith(lower) ||
        p.name.toLowerCase().includes(lower) ||
        (p.description ?? '').toLowerCase().includes(lower) ||
        (p.tags ?? []).some((t) => normalize(t).includes(normalized))
      )
      .slice(0, 6)
      .map(({ id, name, slug, base_price, sale_price, images }) => ({
        id, name, slug, base_price, sale_price, images,
      }))

    return NextResponse.json({ products, categories } satisfies SearchApiResponse)
  }

  // ── Supabase ──────────────────────────────────────────────────────────────
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // 1-char: prefix search (starts with) — fast and focused
    // 2+chars: broader contains search on name + description
    const nameFilter = term.length === 1
      ? `name.ilike.${term}%`
      : `name.ilike.%${term}%,description.ilike.%${term}%`

    const [nameRes, tagRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, slug, base_price, sale_price, images')
        .or(nameFilter)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(term.length === 1 ? 5 : 4),

      // Tag search only for 2+ chars (tags like "deportivo", "casual", etc.)
      term.length >= 2
        ? supabase
            .from('products')
            .select('id, name, slug, base_price, sale_price, images')
            .contains('tags', [normalized])
            .eq('is_active', true)
            .order('is_featured', { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
    ])

    // Merge name + tag results, deduplicate by id
    const nameProducts = (nameRes.data ?? []) as SearchProductResult[]
    const tagProducts = (tagRes.data ?? []) as SearchProductResult[]
    const seenIds = new Set(nameProducts.map((p) => p.id))
    products = [
      ...nameProducts,
      ...tagProducts.filter((p) => !seenIds.has(p.id)),
    ].slice(0, 6)
  } catch {
    // return empty products on error
  }

  return NextResponse.json({ products, categories } satisfies SearchApiResponse)
}
