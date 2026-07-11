import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Fashion product images (verified Unsplash CDN IDs) ──────────────────────
// Only IDs confirmed working in production (used in layout images)

const IMG = {
  // Women clothing — two verified IDs used across products
  wA: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=800&q=80&fit=crop', // women clothing store
  wB: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&q=80&fit=crop', // woman fashion editorial
  // Men clothing — two verified IDs
  mA: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600&h=800&q=80&fit=crop', // man street style
  mB: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&q=80&fit=crop', // man portrait
  // Kids — verified
  kA: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=800&q=80&fit=crop', // kids fashion
  // Shoes — verified (confirmed in production screenshots)
  sA: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&q=80&fit=crop', // red/colorful shoe
  sB: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&q=80&fit=crop', // reuses sA — sB (photo-1518611649869) was deleted from Unsplash
  // Accessories — verified layout ID
  aA: 'https://images.unsplash.com/photo-1611558709798-e009c8fd7706?w=600&h=800&q=80&fit=crop', // handbag
  // Additional verified IDs from layout images
  xA: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=800&q=80&fit=crop', // fashion show / nueva colección
  xB: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=800&q=80&fit=crop', // sale / shopping colorful
  xC: 'https://images.unsplash.com/photo-1556742212-5b321f3c261b?w=600&h=800&q=80&fit=crop', // shopping bags
}

// ─── Size / color helpers ──────────────────────────────────────────────────────

const COLOR = {
  negro:       { name: 'Negro',       hex: '#111111' },
  blanco:      { name: 'Blanco',      hex: '#FFFFFF' },
  gris:        { name: 'Gris',        hex: '#888888' },
  azul:        { name: 'Azul',        hex: '#2563EB' },
  azul_marino: { name: 'Azul marino', hex: '#003153' },
  beige:       { name: 'Beige',       hex: '#F5F0E8' },
  camel:       { name: 'Camel',       hex: '#C19A6B' },
  cafe:        { name: 'Café',        hex: '#8B4513' },
  rosa:        { name: 'Rosa',        hex: '#FFB6C1' },
  fucsia:      { name: 'Fucsia',      hex: '#E91E8C' },
  verde:       { name: 'Verde',       hex: '#2ECC71' },
  verde_mil:   { name: 'Verde militar', hex: '#4A5240' },
  rojo:        { name: 'Rojo',        hex: '#C0392B' },
  amarillo:    { name: 'Amarillo',    hex: '#F1C40F' },
  morado:      { name: 'Morado',      hex: '#8E44AD' },
}

const CLO_SIZES = ['XS', 'S', 'M', 'L', 'XL']
const SHO_W     = ['35', '36', '37', '38', '39', '40']
const SHO_M     = ['39', '40', '41', '42', '43', '44']
const SHO_K     = ['26', '27', '28', '29', '30', '31']

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function variants(
  productId: string,
  sizes: string[],
  colors: { name: string; hex: string }[],
  skuPrefix: string,
): object[] {
  const rows: object[] = []
  sizes.forEach((size) => {
    colors.forEach((color) => {
      rows.push({
        product_id: productId,
        size,
        color: color.name,
        color_hex: color.hex,
        stock: Math.floor(Math.random() * 15) + 3,
        sku: `${skuPrefix}-${size}-${color.name.replace(/\s/g, '').toUpperCase().slice(0, 3)}`,
      })
    })
  })
  return rows
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

type ProductDef = {
  name: string
  description: string
  gender: 'women' | 'men' | 'kids' | 'unisex'
  type: 'clothing' | 'shoes' | 'accessories'
  base_price: number
  sale_price?: number
  is_new?: boolean
  is_featured?: boolean
  images: string[]
  tags: string[]
  sizes: string[]
  colors: { name: string; hex: string }[]
}

const PRODUCTS: ProductDef[] = [
  // ─── MUJER — ROPA (10) ────────────────────────────────────────────────────
  {
    name: 'Vestido Floral Midi',
    description: 'Vestido midi con estampado floral, escote en V y cintura ajustada. Perfecto para el día o una noche especial.',
    gender: 'women', type: 'clothing',
    base_price: 89_000,
    is_featured: true, is_new: true,
    images: [IMG.wA, IMG.wB],
    tags: ['vestido', 'floral', 'midi', 'primavera'],
    sizes: CLO_SIZES, colors: [COLOR.blanco, COLOR.rosa, COLOR.azul],
  },
  {
    name: 'Jean Skinny Push Up',
    description: 'Jean skinny con efecto push up, levantamiento garantizado. Tejido elástico que moldea perfectamente la figura.',
    gender: 'women', type: 'clothing',
    base_price: 120_000, sale_price: 79_000,
    is_featured: true,
    images: [IMG.wB, IMG.wA],
    tags: ['jean', 'skinny', 'push-up', 'oferta'],
    sizes: CLO_SIZES, colors: [COLOR.negro, COLOR.azul, COLOR.gris],
  },
  {
    name: 'Blusa Off-Shoulder Seda',
    description: 'Blusa off-shoulder en tela satinada estilo seda. Caída elegante, ideal para eventos o salidas casuales chic.',
    gender: 'women', type: 'clothing',
    base_price: 65_000,
    is_new: true,
    images: [IMG.wA, IMG.wB],
    tags: ['blusa', 'off-shoulder', 'elegante'],
    sizes: CLO_SIZES, colors: [COLOR.blanco, COLOR.negro, COLOR.fucsia],
  },
  {
    name: 'Conjunto Deportivo Rosa',
    description: 'Set deportivo top + leggins de alto rendimiento. Tela compresiva con tecnología anti-humedad. Ideal para gym o yoga.',
    gender: 'women', type: 'clothing',
    base_price: 145_000, sale_price: 99_000,
    is_featured: true,
    images: [IMG.wB, IMG.wA],
    tags: ['deportivo', 'conjunto', 'gym', 'yoga', 'oferta'],
    sizes: CLO_SIZES, colors: [COLOR.rosa, COLOR.negro, COLOR.morado],
  },
  {
    name: 'Falda Midi Plisada',
    description: 'Falda midi plisada en satín con cintura elástica. Movimiento fluido perfecto para cualquier ocasión.',
    gender: 'women', type: 'clothing',
    base_price: 75_000, sale_price: 52_000,
    images: [IMG.wA, IMG.wB],
    tags: ['falda', 'midi', 'plisada', 'satín', 'oferta'],
    sizes: CLO_SIZES, colors: [COLOR.negro, COLOR.camel, COLOR.verde],
  },
  {
    name: 'Chaqueta Denim Oversize',
    description: 'Chaqueta de mezclilla oversize con lavado desgastado. El clásico que nunca pasa de moda, ahora con ajuste moderno.',
    gender: 'women', type: 'clothing',
    base_price: 165_000,
    is_new: true, is_featured: true,
    images: [IMG.wB, IMG.wA],
    tags: ['chaqueta', 'denim', 'oversize', 'casual'],
    sizes: CLO_SIZES, colors: [COLOR.azul, COLOR.negro, COLOR.blanco],
  },
  {
    name: 'Top Cropped Algodón',
    description: 'Top cropped en algodón 100% transpirable. Corte moderno y cómodo, ideal para combinar con jeans o faldas.',
    gender: 'women', type: 'clothing',
    base_price: 45_000,
    is_new: true,
    images: [IMG.wA, IMG.wB],
    tags: ['top', 'cropped', 'algodón', 'casual'],
    sizes: CLO_SIZES, colors: [COLOR.blanco, COLOR.negro, COLOR.amarillo, COLOR.rosa],
  },
  {
    name: 'Pantalón Palazzo Beige',
    description: 'Pantalón palazzo de tiro alto con pierna muy ancha. Fluido y elegante, perfecto para la temporada cálida.',
    gender: 'women', type: 'clothing',
    base_price: 95_000, sale_price: 65_000,
    images: [IMG.wB, IMG.wA],
    tags: ['pantalón', 'palazzo', 'elegante', 'fluido', 'oferta'],
    sizes: CLO_SIZES, colors: [COLOR.beige, COLOR.blanco, COLOR.negro],
  },
  {
    name: 'Abrigo Trench Camel',
    description: 'Abrigo trench clásico en tela gabardina premium. Cinturón ajustable, solapas dobles. El básico de todo armario.',
    gender: 'women', type: 'clothing',
    base_price: 280_000, sale_price: 189_000,
    images: [IMG.wA, IMG.wB],
    tags: ['abrigo', 'trench', 'clásico', 'oferta'],
    sizes: CLO_SIZES, colors: [COLOR.camel, COLOR.negro, COLOR.beige],
  },
  {
    name: 'Mono Casual Verano',
    description: 'Mono de tirantes con cintura fruncida. Fresco, cómodo y muy versátil. Úsalo solo o con chaqueta.',
    gender: 'women', type: 'clothing',
    base_price: 110_000,
    is_new: true, is_featured: true,
    images: [IMG.wB, IMG.wA],
    tags: ['mono', 'casual', 'verano', 'nuevo'],
    sizes: CLO_SIZES, colors: [COLOR.azul_marino, COLOR.blanco, COLOR.verde],
  },
  // ─── MUJER — ZAPATOS (5) ──────────────────────────────────────────────────
  {
    name: 'Sandalia Plataforma Blanca',
    description: 'Sandalia con plataforma de 5 cm, tiras cruzadas y hebilla ajustable. Estilo y comodidad garantizados.',
    gender: 'women', type: 'shoes',
    base_price: 135_000,
    is_new: true,
    images: [IMG.sA, IMG.sB],
    tags: ['sandalia', 'plataforma', 'verano', 'nuevo'],
    sizes: SHO_W, colors: [COLOR.blanco, COLOR.negro, COLOR.camel],
  },
  {
    name: 'Bota Caña Alta Café',
    description: 'Bota de caña alta en cuero sintético con taco bajo de 3 cm. Cierre lateral, plantilla acolchada. Ideal para otoño.',
    gender: 'women', type: 'shoes',
    base_price: 210_000, sale_price: 139_000,
    images: [IMG.sB, IMG.sA],
    tags: ['bota', 'caña alta', 'café', 'otoño', 'oferta'],
    sizes: SHO_W, colors: [COLOR.cafe, COLOR.negro],
  },
  {
    name: 'Tenis Casual Blancos Mujer',
    description: 'Tenis casuales en piel sintética blanca con suela de goma. El básico más versátil del guardarropa femenino.',
    gender: 'women', type: 'shoes',
    base_price: 160_000,
    is_featured: true,
    images: [IMG.sA, IMG.sB],
    tags: ['tenis', 'casual', 'blanco', 'básico'],
    sizes: SHO_W, colors: [COLOR.blanco, COLOR.negro, COLOR.rosa],
  },
  {
    name: 'Tacón Stiletto Negro',
    description: 'Zapato de tacón stiletto de 10 cm en charol negro. Punta cerrada, interior forrado. Perfecto para eventos formales.',
    gender: 'women', type: 'shoes',
    base_price: 185_000,
    images: [IMG.sB, IMG.sA],
    tags: ['tacón', 'stiletto', 'negro', 'formal', 'elegante'],
    sizes: SHO_W, colors: [COLOR.negro, COLOR.rojo, COLOR.beige],
  },
  {
    name: 'Flat Mule Tejida',
    description: 'Mule plana de tejido trenzado con punta cuadrada. Cómoda, moderna y perfecta para el día a día.',
    gender: 'women', type: 'shoes',
    base_price: 95_000,
    is_new: true,
    images: [IMG.sA, IMG.sB],
    tags: ['flat', 'mule', 'tejido', 'casual', 'nuevo'],
    sizes: SHO_W, colors: [COLOR.camel, COLOR.negro, COLOR.blanco],
  },
  // ─── MUJER — ACCESORIOS (3) ───────────────────────────────────────────────
  {
    name: 'Bolso Tote Cuero Crema',
    description: 'Bolso tote grande en cuero sintético premium. Espacioso, con bolsillo interior zipeado y asa corta y larga.',
    gender: 'women', type: 'accessories',
    base_price: 220_000,
    is_featured: true,
    images: [IMG.aA, IMG.xC],
    tags: ['bolso', 'tote', 'cuero', 'premium'],
    sizes: ['Único'], colors: [COLOR.beige, COLOR.negro, COLOR.cafe],
  },
  {
    name: 'Bolso Crossbody Mini',
    description: 'Bolso crossbody mini en piel sintética con cadena dorada. Elegante y práctico para el día y la noche.',
    gender: 'women', type: 'accessories',
    base_price: 120_000,
    is_new: true,
    images: [IMG.xC, IMG.aA],
    tags: ['bolso', 'crossbody', 'mini', 'cadena'],
    sizes: ['Único'], colors: [COLOR.negro, COLOR.rosa, COLOR.beige, COLOR.rojo],
  },
  {
    name: 'Set Joyería Dorada',
    description: 'Set de aretes + collar + pulsera en metal dorado. Baño en oro 18k, antialérgico. Presentación en caja regalo.',
    gender: 'women', type: 'accessories',
    base_price: 55_000,
    is_new: true,
    images: [IMG.aA, IMG.xC],
    tags: ['joyería', 'aretes', 'collar', 'dorado', 'regalo'],
    sizes: ['Único'], colors: [COLOR.negro],
  },
  // ─── HOMBRE — ROPA (8) ────────────────────────────────────────────────────
  {
    name: 'Camisa Oxford Celeste',
    description: 'Camisa Oxford de corte slim fit en algodón 100%. Ideal para el trabajo o una salida casual elegante.',
    gender: 'men', type: 'clothing',
    base_price: 95_000,
    is_featured: true,
    images: [IMG.mA, IMG.mB],
    tags: ['camisa', 'oxford', 'slim fit', 'formal'],
    sizes: CLO_SIZES, colors: [COLOR.azul, COLOR.blanco, COLOR.gris],
  },
  {
    name: 'Jean Slim Fit Oscuro',
    description: 'Jean de corte slim fit en denim oscuro elastizado. Elástico, cómodo y estilizado. El pantalón comodín del hombre moderno.',
    gender: 'men', type: 'clothing',
    base_price: 130_000,
    is_featured: true,
    images: [IMG.mB, IMG.mA],
    tags: ['jean', 'slim fit', 'oscuro', 'básico'],
    sizes: CLO_SIZES, colors: [COLOR.azul_marino, COLOR.negro, COLOR.gris],
  },
  {
    name: 'Camiseta Básica Premium',
    description: 'Camiseta de algodón pima 180 g/m². Cuello redondo reforzado, costuras dobles. Durabilidad y confort superiores.',
    gender: 'men', type: 'clothing',
    base_price: 55_000,
    is_new: true,
    images: [IMG.mA, IMG.mB],
    tags: ['camiseta', 'básica', 'algodón', 'casual'],
    sizes: CLO_SIZES, colors: [COLOR.negro, COLOR.blanco, COLOR.gris, COLOR.azul_marino],
  },
  {
    name: 'Pantalón Cargo Caqui',
    description: 'Pantalón cargo de tela ripstop resistente. Múltiples bolsillos funcionales, cinturón incluido. Estilo utility moderno.',
    gender: 'men', type: 'clothing',
    base_price: 110_000,
    is_new: true,
    images: [IMG.mB, IMG.mA],
    tags: ['pantalón', 'cargo', 'caqui', 'utility'],
    sizes: CLO_SIZES, colors: [COLOR.verde_mil, COLOR.negro, COLOR.beige],
  },
  {
    name: 'Chaqueta Cuero Sintético',
    description: 'Chaqueta biker en cuero sintético premium. Forro interior, múltiples bolsillos y cremalleras en contraste.',
    gender: 'men', type: 'clothing',
    base_price: 195_000, sale_price: 120_000,
    images: [IMG.mA, IMG.mB],
    tags: ['chaqueta', 'cuero', 'biker', 'oferta'],
    sizes: CLO_SIZES, colors: [COLOR.negro, COLOR.cafe],
  },
  {
    name: 'Polo Piqué Hombre',
    description: 'Polo de piqué clásico con cuello y botones. 100% algodón transpirable. Perfecto para look smart casual.',
    gender: 'men', type: 'clothing',
    base_price: 65_000, sale_price: 45_000,
    images: [IMG.mB, IMG.mA],
    tags: ['polo', 'piqué', 'smart casual', 'oferta'],
    sizes: CLO_SIZES, colors: [COLOR.blanco, COLOR.negro, COLOR.azul, COLOR.rojo],
  },
  {
    name: 'Camisa Lino Verano',
    description: 'Camisa de lino puro manga larga con cuello mao. Fresca, transpirable, ideal para climas cálidos.',
    gender: 'men', type: 'clothing',
    base_price: 89_000,
    is_new: true,
    images: [IMG.mA, IMG.mB],
    tags: ['camisa', 'lino', 'verano', 'casual'],
    sizes: CLO_SIZES, colors: [COLOR.blanco, COLOR.beige, COLOR.azul, COLOR.verde_mil],
  },
  {
    name: 'Traje Casual Gris',
    description: 'Conjunto saco + pantalón en tela tropical de alta calidad. Forrado al medio, ideal para eventos semiformales.',
    gender: 'men', type: 'clothing',
    base_price: 350_000,
    is_featured: true,
    images: [IMG.mB, IMG.mA],
    tags: ['traje', 'saco', 'formal', 'elegante'],
    sizes: CLO_SIZES, colors: [COLOR.gris, COLOR.negro, COLOR.azul_marino],
  },
  // ─── HOMBRE — ZAPATOS (4) ─────────────────────────────────────────────────
  {
    name: 'Tenis Casual Hombre Negro',
    description: 'Tenis low-top en piel sintética con suela de goma ligera. Cómodo para el uso diario, estilo urbano limpio.',
    gender: 'men', type: 'shoes',
    base_price: 180_000,
    is_featured: true,
    images: [IMG.sA, IMG.sB],
    tags: ['tenis', 'casual', 'urbano', 'básico'],
    sizes: SHO_M, colors: [COLOR.negro, COLOR.blanco, COLOR.gris],
  },
  {
    name: 'Mocasín Cuero Hombre',
    description: 'Mocasín sin cordones en cuero genuino con suela de cuero. Elegante y cómodo para uso diario o profesional.',
    gender: 'men', type: 'shoes',
    base_price: 220_000,
    images: [IMG.sB, IMG.sA],
    tags: ['mocasín', 'cuero', 'elegante', 'formal'],
    sizes: SHO_M, colors: [COLOR.cafe, COLOR.negro, COLOR.camel],
  },
  {
    name: 'Bota Chelsea Hombre',
    description: 'Bota Chelsea en cuero sintético con elásticos laterales. Tacón bajo cubano, punta ligeramente redondeada.',
    gender: 'men', type: 'shoes',
    base_price: 250_000, sale_price: 185_000,
    images: [IMG.sA, IMG.sB],
    tags: ['bota', 'chelsea', 'cuero', 'oferta'],
    sizes: SHO_M, colors: [COLOR.negro, COLOR.cafe],
  },
  {
    name: 'Sandalia Outdoor Hombre',
    description: 'Sandalia outdoor con suela de EVA ultra liviana y correas ajustables. Perfecta para playa, montaña o ciudad.',
    gender: 'men', type: 'shoes',
    base_price: 120_000,
    is_new: true,
    images: [IMG.sB, IMG.sA],
    tags: ['sandalia', 'outdoor', 'playa', 'casual'],
    sizes: SHO_M, colors: [COLOR.negro, COLOR.verde_mil, COLOR.gris],
  },
  // ─── HOMBRE — ACCESORIOS (2) ──────────────────────────────────────────────
  {
    name: 'Mochila Laptop Urbana',
    description: 'Mochila para laptop hasta 15" con compartimentos organizados, puerto USB externo y material resistente al agua.',
    gender: 'men', type: 'accessories',
    base_price: 185_000,
    is_featured: true,
    images: [IMG.aA, IMG.xC],
    tags: ['mochila', 'laptop', 'urbana', 'trabajo'],
    sizes: ['Único'], colors: [COLOR.negro, COLOR.gris, COLOR.azul_marino],
  },
  {
    name: 'Cinturón Cuero Trenzado',
    description: 'Cinturón de cuero trenzado genuino con hebilla de metal. Ancho 3.5 cm. Disponible en varios tonos.',
    gender: 'men', type: 'accessories',
    base_price: 65_000,
    images: [IMG.xC, IMG.aA],
    tags: ['cinturón', 'cuero', 'trenzado', 'básico'],
    sizes: ['S/M', 'M/L', 'L/XL'], colors: [COLOR.negro, COLOR.cafe, COLOR.camel],
  },
  // ─── NIÑOS — ROPA (5) ─────────────────────────────────────────────────────
  {
    name: 'Vestido Niña Mariposas',
    description: 'Vestido con estampado de mariposas en tela suave 100% algodón. Bolero incluido. Cómodo y adorable.',
    gender: 'kids', type: 'clothing',
    base_price: 58_000,
    is_new: true,
    images: [IMG.kA, IMG.wA],
    tags: ['vestido', 'niña', 'mariposas', 'algodón'],
    sizes: ['2T', '3T', '4T', '5T', '6T'], colors: [COLOR.rosa, COLOR.amarillo, COLOR.azul],
  },
  {
    name: 'Conjunto Niño Verano',
    description: 'Conjunto de camiseta + bermuda en tela jersey suave. Estampado tropical divertido. Lavable a máquina.',
    gender: 'kids', type: 'clothing',
    base_price: 62_000,
    is_new: true,
    images: [IMG.kA, IMG.mA],
    tags: ['conjunto', 'niño', 'verano', 'camiseta', 'bermuda'],
    sizes: ['2T', '3T', '4T', '5T', '6T'], colors: [COLOR.azul, COLOR.verde, COLOR.rojo],
  },
  {
    name: 'Set Leggins Niña Floral',
    description: 'Pack de 2 leggins niña en algodón elastizado con estampados florales. Cinturilla cómoda sin presión.',
    gender: 'kids', type: 'clothing',
    base_price: 35_000,
    images: [IMG.kA, IMG.wB],
    tags: ['leggins', 'niña', 'floral', 'pack'],
    sizes: ['2T', '3T', '4T', '5T', '6T'], colors: [COLOR.rosa, COLOR.morado],
  },
  {
    name: 'Camiseta Niño Estampada',
    description: 'Camiseta de manga corta con estampado gráfico divertido. Algodón suave antiencogimiento. Colores vibrantes.',
    gender: 'kids', type: 'clothing',
    base_price: 40_000,
    is_new: true,
    images: [IMG.kA, IMG.mB],
    tags: ['camiseta', 'niño', 'estampada', 'casual'],
    sizes: ['2T', '3T', '4T', '5T', '6T', '7T'], colors: [COLOR.azul, COLOR.rojo, COLOR.amarillo, COLOR.verde],
  },
  {
    name: 'Conjunto Deportivo Niña',
    description: 'Conjunto de hoodie + legging deportivo para niña. Tela técnica transpirable, ideal para actividades al aire libre.',
    gender: 'kids', type: 'clothing',
    base_price: 75_000,
    is_featured: true,
    images: [IMG.kA, IMG.wA],
    tags: ['conjunto', 'deportivo', 'niña', 'hoodie'],
    sizes: ['2T', '3T', '4T', '5T', '6T', '7T'], colors: [COLOR.fucsia, COLOR.morado, COLOR.negro],
  },
  // ─── NIÑOS — ZAPATOS (3) ──────────────────────────────────────────────────
  {
    name: 'Tenis Niños Velcro',
    description: 'Tenis con cierre de velcro para niños. Suela flexible antideslizante, interior acolchado. Fácil de poner y quitar.',
    gender: 'kids', type: 'shoes',
    base_price: 85_000,
    is_new: true,
    images: [IMG.sA, IMG.sB],
    tags: ['tenis', 'niños', 'velcro', 'escuela'],
    sizes: SHO_K, colors: [COLOR.blanco, COLOR.negro, COLOR.azul, COLOR.rosa],
  },
  {
    name: 'Sandalia Niña Rosa',
    description: 'Sandalia niña con diseño floral y strass. Suela blanda antideslizante, correa ajustable. Cómoda para uso diario.',
    gender: 'kids', type: 'shoes',
    base_price: 65_000, sale_price: 45_000,
    images: [IMG.sB, IMG.sA],
    tags: ['sandalia', 'niña', 'floral', 'verano', 'oferta'],
    sizes: SHO_K, colors: [COLOR.rosa, COLOR.fucsia, COLOR.blanco],
  },
  {
    name: 'Bota Lluvia Niños',
    description: 'Bota de lluvia 100% impermeable para niños. Interior forrado, suela antideslizante. Con diseños divertidos.',
    gender: 'kids', type: 'shoes',
    base_price: 75_000, sale_price: 55_000,
    images: [IMG.sA, IMG.sB],
    tags: ['bota', 'lluvia', 'impermeable', 'niños', 'oferta'],
    sizes: SHO_K, colors: [COLOR.rojo, COLOR.azul, COLOR.amarillo],
  },
]

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const expectedSecret = process.env.SEED_SECRET
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Seed endpoint disabled (SEED_SECRET not configured).' }, { status: 403 })
  }
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    // ── 1. Upsert main categories ───────────────────────────────────────────
    const categories = [
      { name: 'Mujer',            slug: 'mujer',      gender: 'women', image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&q=80&fit=crop', order: 1 },
      { name: 'Hombre',           slug: 'hombre',     gender: 'men',   image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&q=80&fit=crop', order: 2 },
      { name: 'Niños',            slug: 'ninos',      gender: 'kids',  image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=800&q=80&fit=crop', order: 3 },
      { name: 'Zapatos',          slug: 'zapatos',    gender: null,    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&q=80&fit=crop', order: 4 },
      { name: 'Accesorios',       slug: 'accesorios', gender: null,    image_url: 'https://images.unsplash.com/photo-1611558709798-e009c8fd7706?w=600&h=800&q=80&fit=crop', order: 5 },
    ]

    const { data: existingCats } = await supabase.from('categories').select('id, slug')
    const catMap: Record<string, string> = {}
    for (const c of existingCats ?? []) catMap[c.slug] = c.id

    for (const cat of categories) {
      if (catMap[cat.slug]) continue
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...cat, parent_id: null })
        .select('id, slug')
        .single()
      if (error) throw new Error(`Category insert failed (${cat.slug}): ${error.message}`)
      catMap[cat.slug] = data.id
    }

    // ── 2. Check / reset existing products ─────────────────────────────────
    const reset = req.nextUrl.searchParams.get('reset') === 'true'

    const { count: existingCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if ((existingCount ?? 0) > 0 && !reset) {
      return NextResponse.json({
        ok: true,
        message: `Ya existen ${existingCount} productos. Agrega ?reset=true para borrar y resembrar.`,
      })
    }

    if (reset && (existingCount ?? 0) > 0) {
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }

    // ── 3. Insert products + variants ──────────────────────────────────────
    let productsInserted = 0
    let variantsInserted = 0

    for (const p of PRODUCTS) {
      const catSlug = p.gender === 'women' ? 'mujer'
        : p.gender === 'men' ? 'hombre'
        : p.gender === 'kids' ? 'ninos'
        : p.type === 'shoes' ? 'zapatos'
        : 'accesorios'
      const category_id = catMap[catSlug]

      const productSlug = slug(p.name) + '-' + Math.random().toString(36).slice(2, 6)

      const { data: product, error: pErr } = await supabase
        .from('products')
        .insert({
          name: p.name,
          slug: productSlug,
          description: p.description,
          category_id,
          gender: p.gender,
          type: p.type,
          base_price: p.base_price,
          sale_price: p.sale_price ?? null,
          is_new: p.is_new ?? false,
          is_featured: p.is_featured ?? false,
          is_active: true,
          images: p.images,
          tags: p.tags,
        })
        .select('id')
        .single()

      if (pErr) throw new Error(`Product insert failed (${p.name}): ${pErr.message}`)
      productsInserted++

      const skuPrefix = product.id.slice(0, 8).toUpperCase()
      const varRows = variants(product.id, p.sizes, p.colors, skuPrefix)

      const { error: vErr } = await supabase.from('product_variants').insert(varRows)
      if (vErr) throw new Error(`Variants insert failed (${p.name}): ${vErr.message}`)
      variantsInserted += varRows.length
    }

    return NextResponse.json({
      ok: true,
      message: `Seed completado: ${productsInserted} productos y ${variantsInserted} variantes insertados.`,
      productsInserted,
      variantsInserted,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seed]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
