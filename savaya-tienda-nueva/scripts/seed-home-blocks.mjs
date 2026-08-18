/**
 * Inserts the new home CMS blocks into the DB.
 * Run with: node --env-file=.env.local scripts/seed-home-blocks.mjs
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const [page] = await sql`SELECT id FROM pages WHERE slug = 'home' LIMIT 1`
if (!page) { console.error('Page not found'); process.exit(1) }

const blocks = [
  {
    type: 'editorial_block',
    sort_order: 5,
    content: {
      variant: 'split',
      eyebrow: 'NUEVA COLECCIÓN',
      headline: 'HECHA PARA BRILLAR',
      headlineAccent: 'BRILLAR',
      body: 'Cada par SAVAYA nace de la pasión por el diseño y la artesanía venezolana. Descubre la colección que define la temporada.',
      ctaText: 'Ver colección',
      ctaHref: '/nueva-coleccion',
      imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&q=80',
      imageAlt: 'Sandalia dorada SAVAYA',
      imagePosition: 'right',
    },
  },
  {
    type: 'split_block',
    sort_order: 6,
    content: {
      leftEyebrow: 'PARA ELLA',
      leftLabel: 'MUJER',
      leftHref: '/mujer',
      leftImageUrl: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80',
      rightEyebrow: 'PARA ÉL',
      rightLabel: 'HOMBRE',
      rightHref: '/hombre',
      rightImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      rightShowMark: true,
    },
  },
  {
    type: 'promo_banner',
    sort_order: 7,
    content: {
      eyebrow: 'OFERTA ESPECIAL',
      headline: 'ENVÍO GRATIS EN TU PRIMER PEDIDO',
      subheadline: 'Válido para compras a partir de $50 USD. Solo por tiempo limitado.',
      ctaText: 'Comprar ahora',
      ctaHref: '/nueva-coleccion',
    },
  },
  {
    type: 'social_proof_grid',
    sort_order: 8,
    content: {
      heading: 'SAVAYA EN MOVIMIENTO',
      images: [
        { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80', alt: 'Sandalia gladiadora camel', href: '/producto/sandalia-gladiadora' },
        { url: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=600&q=80', alt: 'Flat punto fino negro', href: '/categoria/flats' },
        { url: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&q=80', alt: 'Mule cuadrada tendencia' },
        { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', alt: 'Sneaker chunky plataforma' },
      ],
    },
  },
  {
    type: 'newsletter',
    sort_order: 9,
    content: {
      eyebrow: 'COMUNIDAD SAVAYA',
      headline: 'ÚNETE Y DESCUBRE PRIMERO',
      subheadline: 'Recibe las nuevas colecciones, ofertas exclusivas y contenido especial directamente en tu correo.',
      placeholder: 'Tu correo electrónico',
      ctaText: 'Suscribirme',
    },
  },
]

for (const block of blocks) {
  await sql`
    INSERT INTO page_sections (page_id, type, content, sort_order, is_active)
    VALUES (${page.id}, ${block.type}, ${JSON.stringify(block.content)}, ${block.sort_order}, true)
    ON CONFLICT DO NOTHING
  `
  console.log(`✓ ${block.type}`)
}

console.log('\nListo.')
