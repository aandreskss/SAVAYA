/**
 * SAVAYA — seed de productos de ejemplo
 *
 * Inserta 18 productos con variantes, imágenes (Unsplash) e inventario.
 * Requiere que el seed principal ya se haya corrido (sizes, colors, categories existen).
 *
 * Uso:
 *   node scripts/seed-sample-products.mjs
 *
 * Variables de entorno:
 *   DATABASE_URL = connection string de Neon
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function query(strings, ...values) {
  return sql(strings, ...values)
}

// ---------------------------------------------------------------------------
// Leer datos existentes
// ---------------------------------------------------------------------------

async function loadLookups() {
  const [sizesRows, colorsRows, categoriesRows] = await Promise.all([
    sql`SELECT id, name FROM sizes ORDER BY sort_order`,
    sql`SELECT id, name FROM colors`,
    sql`SELECT id, name FROM categories`,
  ])

  const sizes = Object.fromEntries(sizesRows.map(r => [r.name, r.id]))
  const colors = Object.fromEntries(colorsRows.map(r => [r.name, r.id]))
  const categories = Object.fromEntries(categoriesRows.map(r => [r.name, r.id]))

  return { sizes, colors, categories }
}

// ---------------------------------------------------------------------------
// Catálogo de productos de ejemplo
// ---------------------------------------------------------------------------

function getProducts({ sizes, colors, categories }) {
  const s = sizes   // { '35': uuid, '36': uuid, ... }
  const c = colors  // { 'Negro': uuid, 'Beige': uuid, ... }
  const cat = categories // { 'Sandalias': uuid, ... }

  return [
    // ── Sandalias ─────────────────────────────────────────────────────────
    {
      name: 'Sandalia Trenzada Dorada',
      slug: 'sandalia-trenzada-dorada',
      description: 'Sandalia plana con detalles trenzados en cuero dorado. Diseño artesanal venezolano que combina con cualquier look de verano.',
      categoryId: cat['Sandalias'],
      basePrice: '38.00',
      compareAtPrice: '48.00',
      isFeatured: true,
      isNew: true,
      tags: ['verano', 'plana', 'dorado'],
      images: [
        { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80', alt: 'Sandalia trenzada dorada vista frontal', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80', alt: 'Sandalia trenzada dorada detalle', isPrimary: false },
      ],
      variants: [
        { colorId: c['Dorado'], sizes: ['35','36','37','38','39'], price: '38.00', sku: 'STD-DOR' },
        { colorId: c['Beige'],  sizes: ['35','36','37','38','39'], price: '38.00', sku: 'STD-BEI' },
      ],
      stock: 12,
    },
    {
      name: 'Sandalia Tiras Minimalista',
      slug: 'sandalia-tiras-minimalista',
      description: 'Sandalia con finas tiras ajustables al tobillo. Línea limpia y elegante para uso diario o salidas nocturnas.',
      categoryId: cat['Sandalias'],
      basePrice: '42.00',
      isFeatured: false,
      isNew: true,
      tags: ['minimalista', 'plana', 'negro'],
      images: [
        { url: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&q=80', alt: 'Sandalia tiras minimalista negro', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80', alt: 'Sandalia tiras minimalista nude', isPrimary: false },
      ],
      variants: [
        { colorId: c['Negro'], sizes: ['35','36','37','38','39','40'], price: '42.00', sku: 'STM-NEG' },
        { colorId: c['Nude'],  sizes: ['35','36','37','38','39','40'], price: '42.00', sku: 'STM-NUD' },
        { colorId: c['Café'],  sizes: ['35','36','37','38'],            price: '42.00', sku: 'STM-CAF' },
      ],
      stock: 10,
    },
    {
      name: 'Sandalia Gladiadora',
      slug: 'sandalia-gladiadora',
      description: 'Sandalia de inspiración romana con tiras que ascienden hasta el tobillo. Cuero sintético de alta calidad.',
      categoryId: cat['Sandalias'],
      basePrice: '55.00',
      isFeatured: true,
      isNew: false,
      tags: ['gladiadora', 'tendencia'],
      images: [
        { url: 'https://images.unsplash.com/photo-1612481666897-f3f2a64af5de?w=800&q=80', alt: 'Sandalia gladiadora camel', isPrimary: true },
      ],
      variants: [
        { colorId: c['Camel'], sizes: ['35','36','37','38','39'], price: '55.00', sku: 'SGL-CAM' },
        { colorId: c['Negro'], sizes: ['35','36','37','38','39'], price: '55.00', sku: 'SGL-NEG' },
      ],
      stock: 8,
    },

    // ── Tacones ────────────────────────────────────────────────────────────
    {
      name: 'Tacón Stiletto Clásico',
      slug: 'tacon-stiletto-clasico',
      description: 'El clásico stiletto que nunca pasa de moda. Puntera fina y tacón de aguja de 10cm. Para la mujer que ama el estilo.',
      categoryId: cat['Tacones'],
      basePrice: '65.00',
      compareAtPrice: '80.00',
      isFeatured: true,
      isNew: false,
      tags: ['stiletto', 'elegante', 'noche'],
      images: [
        { url: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80', alt: 'Tacón stiletto negro clásico', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80', alt: 'Tacón stiletto rojo', isPrimary: false },
      ],
      variants: [
        { colorId: c['Negro'], sizes: ['35','36','37','38','39'], price: '65.00', sku: 'TST-NEG' },
        { colorId: c['Rojo'],  sizes: ['35','36','37','38','39'], price: '65.00', sku: 'TST-ROJ' },
        { colorId: c['Nude'],  sizes: ['36','37','38','39'],      price: '65.00', sku: 'TST-NUD' },
      ],
      stock: 8,
    },
    {
      name: 'Tacón Bloque Cómodo',
      slug: 'tacon-bloque-comodo',
      description: 'Tacón cuadrado de 7cm con mayor estabilidad. Perfecto para largas jornadas sin sacrificar el estilo.',
      categoryId: cat['Tacones'],
      basePrice: '58.00',
      isFeatured: false,
      isNew: true,
      tags: ['block heel', 'comodo', 'oficina'],
      images: [
        { url: 'https://images.unsplash.com/photo-1508243771214-6e95d137426b?w=800&q=80', alt: 'Tacón bloque camel', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=800&q=80', alt: 'Tacón bloque nude detail', isPrimary: false },
      ],
      variants: [
        { colorId: c['Camel'],  sizes: ['35','36','37','38','39','40'], price: '58.00', sku: 'TBC-CAM' },
        { colorId: c['Negro'],  sizes: ['35','36','37','38','39','40'], price: '58.00', sku: 'TBC-NEG' },
        { colorId: c['Blanco'], sizes: ['36','37','38','39'],           price: '58.00', sku: 'TBC-BLA' },
      ],
      stock: 10,
    },
    {
      name: 'Kitten Heel Elegante',
      slug: 'kitten-heel-elegante',
      description: 'Tacón bajo tipo kitten de 4cm ideal para lucir femenina todo el día. Puntera redonda y acabado brillante.',
      categoryId: cat['Tacones'],
      basePrice: '52.00',
      isFeatured: false,
      isNew: false,
      tags: ['kitten heel', 'diario', 'elegante'],
      images: [
        { url: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80', alt: 'Kitten heel plateado', isPrimary: true },
      ],
      variants: [
        { colorId: c['Plateado'], sizes: ['35','36','37','38','39'], price: '52.00', sku: 'KHE-PLA' },
        { colorId: c['Negro'],    sizes: ['35','36','37','38','39'], price: '52.00', sku: 'KHE-NEG' },
        { colorId: c['Rosado'],   sizes: ['35','36','37','38'],      price: '52.00', sku: 'KHE-ROS' },
      ],
      stock: 9,
    },

    // ── Plataformas ────────────────────────────────────────────────────────
    {
      name: 'Plataforma Corcho Verano',
      slug: 'plataforma-corcho-verano',
      description: 'Plataforma de corcho con tiras de cuero genuino. 6cm de altura total con cuña cómoda y ligera.',
      categoryId: cat['Plataformas'],
      basePrice: '60.00',
      compareAtPrice: '72.00',
      isFeatured: true,
      isNew: false,
      tags: ['plataforma', 'corcho', 'verano'],
      images: [
        { url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80', alt: 'Plataforma corcho beige', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1573100925118-870b8efc799d?w=800&q=80', alt: 'Plataforma corcho detalle suela', isPrimary: false },
      ],
      variants: [
        { colorId: c['Beige'], sizes: ['35','36','37','38','39'], price: '60.00', sku: 'PCV-BEI' },
        { colorId: c['Negro'], sizes: ['35','36','37','38','39'], price: '60.00', sku: 'PCV-NEG' },
      ],
      stock: 7,
    },
    {
      name: 'Plataforma Chunky Urbana',
      slug: 'plataforma-chunky-urbana',
      description: 'Suela XL de 5cm en goma negra con aspecto urbano. Perfecta para estilizar sin esfuerzo.',
      categoryId: cat['Plataformas'],
      basePrice: '68.00',
      isFeatured: false,
      isNew: true,
      tags: ['chunky', 'urbano', 'tendencia'],
      images: [
        { url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80', alt: 'Plataforma chunky negro', isPrimary: true },
      ],
      variants: [
        { colorId: c['Negro'],  sizes: ['35','36','37','38','39','40'], price: '68.00', sku: 'PCU-NEG' },
        { colorId: c['Blanco'], sizes: ['35','36','37','38','39'],      price: '68.00', sku: 'PCU-BLA' },
      ],
      stock: 6,
    },

    // ── Flats ──────────────────────────────────────────────────────────────
    {
      name: 'Bailarina Clásica',
      slug: 'bailarina-clasica',
      description: 'Ballet flat de cuero con lazo frontal. La elegancia sin esfuerzo en su máxima expresión.',
      categoryId: cat['Flats'],
      basePrice: '45.00',
      isFeatured: false,
      isNew: false,
      tags: ['ballet', 'plana', 'oficina'],
      images: [
        { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80', alt: 'Bailarina clásica negro', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1478345782034-5fff7b1abece?w=800&q=80', alt: 'Bailarina clásica beige', isPrimary: false },
      ],
      variants: [
        { colorId: c['Negro'],  sizes: ['35','36','37','38','39','40'], price: '45.00', sku: 'BCL-NEG' },
        { colorId: c['Beige'],  sizes: ['35','36','37','38','39','40'], price: '45.00', sku: 'BCL-BEI' },
        { colorId: c['Rosado'], sizes: ['35','36','37','38'],           price: '45.00', sku: 'BCL-ROS' },
        { colorId: c['Rojo'],   sizes: ['36','37','38','39'],           price: '45.00', sku: 'BCL-ROJ' },
      ],
      stock: 15,
    },
    {
      name: 'Loafer Mocasín Premium',
      slug: 'loafer-mocasin-premium',
      description: 'Mocasín de cuero italiano con detalle dorado en el frente. Versátil para outfits casuales y formales.',
      categoryId: cat['Flats'],
      basePrice: '72.00',
      compareAtPrice: '85.00',
      isFeatured: true,
      isNew: true,
      tags: ['mocasin', 'loafer', 'premium'],
      images: [
        { url: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80', alt: 'Loafer mocasin café', isPrimary: true },
      ],
      variants: [
        { colorId: c['Café'],        sizes: ['35','36','37','38','39'], price: '72.00', sku: 'LMP-CAF' },
        { colorId: c['Negro'],       sizes: ['35','36','37','38','39'], price: '72.00', sku: 'LMP-NEG' },
        { colorId: c['Azul marino'], sizes: ['36','37','38'],           price: '72.00', sku: 'LMP-AZM' },
      ],
      stock: 8,
    },

    // ── Botas ──────────────────────────────────────────────────────────────
    {
      name: 'Bota Corta Chelsea',
      slug: 'bota-corta-chelsea',
      description: 'Chelsea boot con elástico lateral y puntera cuadrada. Cuero sintético de primera con suela de goma antideslizante.',
      categoryId: cat['Botas'],
      basePrice: '85.00',
      compareAtPrice: '100.00',
      isFeatured: true,
      isNew: false,
      tags: ['chelsea', 'bota corta', 'invierno'],
      images: [
        { url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80', alt: 'Chelsea boot negro', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80', alt: 'Chelsea boot detalle lateral', isPrimary: false },
      ],
      variants: [
        { colorId: c['Negro'], sizes: ['35','36','37','38','39','40'], price: '85.00', sku: 'BCC-NEG' },
        { colorId: c['Café'],  sizes: ['35','36','37','38','39'],      price: '85.00', sku: 'BCC-CAF' },
      ],
      stock: 6,
    },
    {
      name: 'Bota Vaquera Western',
      slug: 'bota-vaquera-western',
      description: 'Bota vaquera de caña media con bordado artesanal. Tendencia western que domina la temporada.',
      categoryId: cat['Botas'],
      basePrice: '95.00',
      isFeatured: false,
      isNew: true,
      tags: ['western', 'vaquera', 'tendencia'],
      images: [
        { url: 'https://images.unsplash.com/photo-1602568816219-68eb8d52db31?w=800&q=80', alt: 'Bota vaquera café', isPrimary: true },
      ],
      variants: [
        { colorId: c['Café'],  sizes: ['35','36','37','38','39'], price: '95.00', sku: 'BVW-CAF' },
        { colorId: c['Negro'], sizes: ['36','37','38','39'],      price: '95.00', sku: 'BVW-NEG' },
      ],
      stock: 5,
    },

    // ── Sneakers ────────────────────────────────────────────────────────────
    {
      name: 'Sneaker Blanco Clásico',
      slug: 'sneaker-blanco-clasico',
      description: 'Sneaker icónico todo blanco con suela chunky. El básico definitivo que va con todo.',
      categoryId: cat['Sneakers'],
      basePrice: '62.00',
      compareAtPrice: '75.00',
      isFeatured: true,
      isNew: false,
      tags: ['sneaker', 'blanco', 'casual'],
      images: [
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Sneaker blanco clásico', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80', alt: 'Sneaker blanco lateral', isPrimary: false },
      ],
      variants: [
        { colorId: c['Blanco'], sizes: ['35','36','37','38','39','40'], price: '62.00', sku: 'SBC-BLA' },
        { colorId: c['Negro'],  sizes: ['35','36','37','38','39','40'], price: '62.00', sku: 'SBC-NEG' },
      ],
      stock: 15,
    },
    {
      name: 'Sneaker Chunky Platform',
      slug: 'sneaker-chunky-platform',
      description: 'Deportivo estilo Y2K con suela plataforma de 5cm. Colores vibrantes y comodidad total.',
      categoryId: cat['Sneakers'],
      basePrice: '78.00',
      isFeatured: false,
      isNew: true,
      tags: ['chunky', 'plataforma', 'y2k'],
      images: [
        { url: 'https://images.unsplash.com/photo-1608231387042-66d1773d3028?w=800&q=80', alt: 'Sneaker chunky blanco', isPrimary: true },
      ],
      variants: [
        { colorId: c['Blanco'],   sizes: ['35','36','37','38','39'], price: '78.00', sku: 'SCP-BLA' },
        { colorId: c['Gris'],     sizes: ['35','36','37','38','39'], price: '78.00', sku: 'SCP-GRI' },
        { colorId: c['Mostaza'],  sizes: ['36','37','38'],           price: '78.00', sku: 'SCP-MOS' },
      ],
      stock: 8,
    },

    // ── Mules ───────────────────────────────────────────────────────────────
    {
      name: 'Mule de Tacón Bajo',
      slug: 'mule-tacon-bajo',
      description: 'Destalonado con tacón bajo de 5cm. Fácil de poner y quitar, ideal para el día a día con un toque chic.',
      categoryId: cat['Mules'],
      basePrice: '48.00',
      isFeatured: false,
      isNew: false,
      tags: ['mule', 'destalonado', 'diario'],
      images: [
        { url: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80', alt: 'Mule tacon bajo negro', isPrimary: true },
      ],
      variants: [
        { colorId: c['Negro'],  sizes: ['35','36','37','38','39','40'], price: '48.00', sku: 'MTB-NEG' },
        { colorId: c['Camel'],  sizes: ['35','36','37','38','39'],      price: '48.00', sku: 'MTB-CAM' },
        { colorId: c['Blanco'], sizes: ['36','37','38','39'],           price: '48.00', sku: 'MTB-BLA' },
      ],
      stock: 11,
    },
    {
      name: 'Mule Cuadrada Tendencia',
      slug: 'mule-cuadrada-tendencia',
      description: 'Mule de punta cuadrada sin tacón. El destalonado más trendy de la temporada en materiales premium.',
      categoryId: cat['Mules'],
      basePrice: '54.00',
      isFeatured: true,
      isNew: true,
      tags: ['mule', 'punta cuadrada', 'tendencia'],
      images: [
        { url: 'https://images.unsplash.com/photo-1612481666897-f3f2a64af5de?w=800&q=80', alt: 'Mule cuadrada beige', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1478345782034-5fff7b1abece?w=800&q=80', alt: 'Mule cuadrada nude', isPrimary: false },
      ],
      variants: [
        { colorId: c['Beige'],    sizes: ['35','36','37','38','39'], price: '54.00', sku: 'MCT-BEI' },
        { colorId: c['Nude'],     sizes: ['35','36','37','38','39'], price: '54.00', sku: 'MCT-NUD' },
        { colorId: c['Mostaza'],  sizes: ['36','37','38'],           price: '54.00', sku: 'MCT-MOS' },
      ],
      stock: 9,
    },
    {
      name: 'Tacón Kitten Nude Satinado',
      slug: 'tacon-kitten-nude-satinado',
      description: 'Kitten heel satinado en tono nude que alarga visualmente la pierna. Elegante, femenino y muy cómodo.',
      categoryId: cat['Tacones'],
      basePrice: '59.00',
      compareAtPrice: '70.00',
      isFeatured: false,
      isNew: false,
      tags: ['kitten', 'nude', 'satinado', 'elegante'],
      images: [
        { url: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?w=800&q=80', alt: 'Kitten heel nude satinado', isPrimary: true },
      ],
      variants: [
        { colorId: c['Nude'],      sizes: ['35','36','37','38','39'], price: '59.00', sku: 'KNS-NUD' },
        { colorId: c['Plateado'],  sizes: ['35','36','37','38'],      price: '59.00', sku: 'KNS-PLA' },
      ],
      stock: 10,
    },
    {
      name: 'Flat Punto Fino Negro',
      slug: 'flat-punto-fino-negro',
      description: 'Zapato plano de punta fina en cuero liso. El esencial de toda venezolana elegante.',
      categoryId: cat['Flats'],
      basePrice: '50.00',
      isFeatured: false,
      isNew: false,
      tags: ['flat', 'punto fino', 'basico'],
      images: [
        { url: 'https://images.unsplash.com/photo-1478345782034-5fff7b1abece?w=800&q=80', alt: 'Flat punto fino negro', isPrimary: true },
      ],
      variants: [
        { colorId: c['Negro'],  sizes: ['35','36','37','38','39','40'], price: '50.00', sku: 'FPF-NEG' },
        { colorId: c['Camel'],  sizes: ['35','36','37','38','39'],      price: '50.00', sku: 'FPF-CAM' },
        { colorId: c['Azul marino'], sizes: ['36','37','38'],           price: '50.00', sku: 'FPF-AZM' },
      ],
      stock: 14,
    },
  ]
}

// ---------------------------------------------------------------------------
// Insertar un producto
// ---------------------------------------------------------------------------

async function insertProduct(product, sizes) {
  const now = new Date().toISOString()

  // 1. Producto
  const [prod] = await sql`
    INSERT INTO products (
      name, slug, description, category_id,
      gender, product_type,
      base_price, compare_at_price,
      is_active, is_featured, is_new,
      tags, published_at,
      created_at, updated_at
    ) VALUES (
      ${product.name},
      ${product.slug},
      ${product.description},
      ${product.categoryId},
      'women', 'shoes',
      ${product.basePrice},
      ${product.compareAtPrice ?? null},
      true,
      ${product.isFeatured},
      ${product.isNew},
      ${product.tags},
      ${now},
      ${now}, ${now}
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id
  `

  if (!prod) {
    console.log(`  ⏭  ${product.name} — ya existe, omitiendo`)
    return
  }

  const productId = prod.id

  // 2. Imágenes
  for (let i = 0; i < product.images.length; i++) {
    const img = product.images[i]
    await sql`
      INSERT INTO product_media (
        product_id, cloudinary_public_id, url, alt_text,
        type, sort_order, is_primary, created_at
      ) VALUES (
        ${productId},
        ${'samples/' + product.slug + '-' + (i + 1)},
        ${img.url},
        ${img.alt},
        'image', ${i}, ${img.isPrimary},
        ${now}
      )
    `
  }

  // 3. Variantes + inventario
  for (const variant of product.variants) {
    for (const sizeName of variant.sizes) {
      const sizeId = sizes[sizeName]
      if (!sizeId) {
        console.warn(`    ⚠ Talla ${sizeName} no encontrada`)
        continue
      }

      const sku = `${variant.sku}-${sizeName}`

      const [v] = await sql`
        INSERT INTO product_variants (
          product_id, color_id, size_id, sku, price,
          is_active, created_at, updated_at
        ) VALUES (
          ${productId}, ${variant.colorId}, ${sizeId},
          ${sku}, ${variant.price},
          true, ${now}, ${now}
        )
        ON CONFLICT (sku) DO NOTHING
        RETURNING id
      `

      if (!v) continue

      // Inventario
      await sql`
        INSERT INTO inventory (variant_id, quantity, reserved, updated_at)
        VALUES (${v.id}, ${product.stock}, 0, ${now})
        ON CONFLICT (variant_id) DO NOTHING
      `

      // Movimiento de inventario
      await sql`
        INSERT INTO inventory_movements (
          variant_id, type, quantity, reason, created_at
        ) VALUES (
          ${v.id}, 'purchase', ${product.stock},
          'Stock inicial — seed de ejemplo',
          ${now}
        )
      `
    }
  }

  console.log(`  ✓  ${product.name}`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌱 Insertando productos de ejemplo SAVAYA...\n')

  const { sizes, colors, categories } = await loadLookups()

  // Verificar que los datos base existan
  if (Object.keys(sizes).length === 0) {
    console.error('❌ No hay tallas en la DB. Corre primero el seed principal.')
    process.exit(1)
  }

  const productList = getProducts({ sizes, colors, categories })

  for (const product of productList) {
    try {
      await insertProduct(product, sizes)
    } catch (err) {
      console.error(`  ✗  ${product.name} — ERROR: ${err.message}`)
    }
  }

  console.log(`\n✅ Seed de productos completado — ${productList.length} productos procesados.\n`)
}

main().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
