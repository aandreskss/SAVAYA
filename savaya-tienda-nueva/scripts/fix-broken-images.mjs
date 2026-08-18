/**
 * Replaces broken Unsplash image URLs for 5 products whose original photos
 * were taken down. Run with:
 *   node --env-file=.env.local scripts/fix-broken-images.mjs
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const fixes = [
  {
    slug: 'sandalia-gladiadora',
    images: [
      { index: 0, url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80', alt: 'Sandalia gladiadora camel vista frontal' },
    ],
  },
  {
    slug: 'flat-punto-fino-negro',
    images: [
      { index: 0, url: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&q=80', alt: 'Flat punto fino negro' },
    ],
  },
  {
    slug: 'mule-cuadrada-tendencia',
    images: [
      { index: 0, url: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80', alt: 'Mule cuadrada beige tendencia' },
      { index: 1, url: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80', alt: 'Mule cuadrada nude detalle' },
    ],
  },
  {
    slug: 'sneaker-chunky-platform',
    images: [
      { index: 0, url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Sneaker chunky plataforma blanco' },
    ],
  },
  {
    slug: 'bota-vaquera-western',
    images: [
      { index: 0, url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&q=80', alt: 'Bota vaquera western caña media' },
    ],
  },
]

async function main() {
  for (const product of fixes) {
    const [row] = await sql`SELECT id FROM products WHERE slug = ${product.slug} LIMIT 1`
    if (!row) {
      console.warn(`⚠  Producto no encontrado: ${product.slug}`)
      continue
    }

    for (const img of product.images) {
      const result = await sql`
        UPDATE product_media
        SET url = ${img.url}, alt_text = ${img.alt}
        WHERE product_id = ${row.id}
          AND sort_order = ${img.index}
      `
      console.log(`✓  ${product.slug} [${img.index}] → ${result.count ?? 0} filas actualizadas`)
    }
  }

  console.log('\nListo.')
}

main().catch((e) => { console.error(e); process.exit(1) })
