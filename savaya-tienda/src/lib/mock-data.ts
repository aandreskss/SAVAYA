import type { Product } from './types'
import type { HeroSlide } from '@/components/home/HeroBanner'

// ─── Hero slides ──────────────────────────────────────────────────────────────

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    eyebrow: 'Nueva Colección — Primavera 2026',
    title: 'El estilo que mereces, al alcance de todos',
    description: 'Descubre las últimas tendencias en moda para mujer, hombre y niños. Calidad premium, precios accesibles.',
    cta: 'Ver Colección',
    href: '/nuevas-colecciones',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=1080&q=80&fit=crop',
  },
  {
    id: 'slide-2',
    eyebrow: 'Moda Masculina',
    title: 'Estilo para cada momento',
    description: 'Camisas, pantalones, chaquetas y más. Looks casuales y formales para el hombre de hoy.',
    cta: 'Explorar Hombre',
    href: '/hombre',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1920&h=1080&q=80&fit=crop',
  },
  {
    id: 'slide-3',
    eyebrow: 'Remates de Temporada',
    title: 'Hasta 50% de descuento',
    description: 'Cientos de productos con precios increíbles. Solo por tiempo limitado.',
    cta: 'Ver Remates',
    href: '/remates',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=1080&q=80&fit=crop',
    accent: 'sale',
  },
]

// ─── Category grid ────────────────────────────────────────────────────────────

export const HOME_CATEGORIES = [
  { label: 'Mujer',   href: '/mujer',   imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&q=80&fit=crop' },
  { label: 'Hombre',  href: '/hombre',  imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&q=80&fit=crop' },
  { label: 'Niños',   href: '/ninos',   imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=800&q=80&fit=crop' },
  { label: 'Zapatos', href: '/zapatos', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&q=80&fit=crop' },
]

// ─── Promo banners ────────────────────────────────────────────────────────────

export const PROMO_BANNERS = [
  {
    title: 'Nueva Colección Femenina',
    cta: 'Descubrir ahora',
    href: '/mujer',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&q=80&fit=crop',
    dark: true,
  },
  {
    title: 'Hasta 50% en Remates',
    cta: 'Ver descuentos',
    href: '/remates',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=600&q=80&fit=crop',
    dark: true,
  },
] as const

// ─── Helper to build a mock product ──────────────────────────────────────────

const MOCK_IMGS = [
  'photo-1483985988355-763728e1935b', // women clothing store
  'photo-1552374196-1ab2a1c593e8',   // men fashion
  'photo-1542291026-7eec264c27ff',   // shoes
  'photo-1611558709798-e009c8fd7706', // accessories
  'photo-1469334031218-e382a71b716b', // woman editorial
  'photo-1507003211169-0a1dd7228f2d', // man portrait
  'photo-1558618666-fcd25c85cd64',   // kids
  'photo-1549298916-b41d501d3772',   // white sneaker
]

function p(
  id: string,
  name: string,
  base_price: number,
  opts: Partial<Product> = {}
): Product {
  const idx = parseInt(id.replace(/\D/g, '') || '0') % MOCK_IMGS.length
  return {
    id,
    name,
    slug: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: null,
    category_id: 'cat-1',
    gender: 'women',
    type: 'clothing',
    base_price,
    sale_price: null,
    is_new: false,
    is_featured: false,
    is_active: true,
    images: [`https://images.unsplash.com/photo-${MOCK_IMGS[idx]}?w=400&h=600&q=80&fit=crop`],
    tags: [],
    created_at: '2026-01-01T00:00:00Z',
    variants: [],
    ...opts,
  }
}

// ─── Featured products (is_featured) ─────────────────────────────────────────

export const FEATURED_PRODUCTS: Product[] = [
  p('fp1', 'Vestido Midi Wrap Floral',    89_000, { gender: 'women', type: 'clothing', is_featured: true }),
  p('fp2', 'Jean Skinny Push Up',        120_000, { gender: 'women', type: 'clothing', is_featured: true, sale_price: 79_000 }),
  p('fp3', 'Camisa Lino Premium',         95_000, { gender: 'men',   type: 'clothing', is_featured: true }),
  p('fp4', 'Jean Slim Fit Oscuro',       130_000, { gender: 'men',   type: 'clothing', is_featured: true }),
  p('fp5', 'Tenis Casual Blancos',       180_000, { gender: 'unisex',type: 'shoes',    is_featured: true }),
  p('fp6', 'Bolso Tote Cuero Crema',     220_000, { gender: 'women', type: 'accessories', is_featured: true }),
  p('fp7', 'Conjunto Deportivo Femenino',145_000, { gender: 'women', type: 'clothing', is_featured: true, sale_price: 99_000 }),
  p('fp8', 'Chaqueta Denim Oversize',    165_000, { gender: 'women', type: 'clothing', is_featured: true, is_new: true }),
]

// ─── New arrivals (is_new) ────────────────────────────────────────────────────

export const NEW_ARRIVALS: Product[] = [
  p('na1', 'Blusa Off-Shoulder Blanca',   55_000, { gender: 'women', type: 'clothing', is_new: true }),
  p('na2', 'Falda Midi Satinada',         75_000, { gender: 'women', type: 'clothing', is_new: true }),
  p('na3', 'Camiseta Polo Piqué',         65_000, { gender: 'men',   type: 'clothing', is_new: true }),
  p('na4', 'Pantalón Cargo Caqui',       110_000, { gender: 'men',   type: 'clothing', is_new: true }),
  p('na5', 'Vestido Niña con Moño',       58_000, { gender: 'kids',  type: 'clothing', is_new: true }),
  p('na6', 'Conjunto Niño Verano',        62_000, { gender: 'kids',  type: 'clothing', is_new: true }),
  p('na7', 'Sandalia Plataforma',        135_000, { gender: 'women', type: 'shoes',    is_new: true }),
  p('na8', 'Gorra Visera Curva',          38_000, { gender: 'unisex',type: 'accessories', is_new: true }),
]

// ─── Sale products ────────────────────────────────────────────────────────────

export const SALE_PRODUCTS: Product[] = [
  p('sp1', 'Abrigo Trench Clásico',      280_000, { gender: 'women', type: 'clothing', sale_price: 189_000 }),
  p('sp2', 'Bota Caña Alta Café',        210_000, { gender: 'women', type: 'shoes',    sale_price: 139_000 }),
  p('sp3', 'Chaqueta Cuero Sintético',   195_000, { gender: 'men',   type: 'clothing', sale_price: 120_000 }),
  p('sp4', 'Zapatilla Tenis Kids',       115_000, { gender: 'kids',  type: 'shoes',    sale_price: 69_000 }),
]
