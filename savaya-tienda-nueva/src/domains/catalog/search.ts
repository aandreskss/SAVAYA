import { db, rawQuery } from '@/shared/lib/db'
import { sql, and, eq } from 'drizzle-orm'
import { products, categories } from '@/domains/catalog/schema'

export type SearchResult = {
  type: 'product' | 'category'
  id: string
  name: string
  slug: string
  imageUrl?: string
  price?: number
  currency: string
}

// Interfaz SearchProvider — permite migrar a Meilisearch después sin tocar el resto
export interface SearchProvider {
  search(query: string, limit?: number): Promise<SearchResult[]>
}

// ---------------------------------------------------------------------------
// PostgresSearchProvider
// Strategy:
//   1. Full-text search via tsvector (exact/stemmed matches, ranked by ts_rank)
//   2. Trigram similarity fallback via pg_trgm (typo tolerance, similarity >= 0.2)
//   3. ILIKE last resort when trgm isn't enabled yet
// Migration 0004_fts_search.sql must be applied for best results.
// ---------------------------------------------------------------------------

export class PostgresSearchProvider implements SearchProvider {
  async search(query: string, limit = 10): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return []

    const q = query.trim()

    try {
      // Full-text + trigram combined — returns at most `limit` products
      const productRows = await rawQuery<{
        id: string
        name: string
        slug: string
        base_price: string
        image_url: string | null
        rank: number
      }>(sql`
        SELECT
          p.id,
          p.name,
          p.slug,
          p.base_price,
          pm.url AS image_url,
          (
            CASE WHEN p.search_vector @@ plainto_tsquery('spanish', ${q})
              THEN ts_rank(p.search_vector, plainto_tsquery('spanish', ${q})) * 2
              ELSE 0
            END +
            similarity(p.name, ${q})
          ) AS rank
        FROM products p
        LEFT JOIN LATERAL (
          SELECT url FROM product_media
          WHERE product_id = p.id AND is_primary = true
          LIMIT 1
        ) pm ON true
        WHERE
          p.is_active = true AND (
            p.search_vector @@ plainto_tsquery('spanish', ${q})
            OR similarity(p.name, ${q}) > 0.15
            OR p.name ILIKE ${'%' + q + '%'}
          )
        ORDER BY rank DESC
        LIMIT ${limit}
      `)

      const categoryRows = await rawQuery<{
        id: string
        name: string
        slug: string
        image_url: string | null
      }>(sql`
        SELECT id, name, slug, image_url
        FROM categories
        WHERE
          is_active = true AND (
            similarity(name, ${q}) > 0.2
            OR name ILIKE ${'%' + q + '%'}
          )
        ORDER BY similarity(name, ${q}) DESC
        LIMIT 4
      `)

      return [
        ...productRows.map((p) => ({
          type: 'product' as const,
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.base_price),
          imageUrl: p.image_url ?? undefined,
          currency: 'USD',
        })),
        ...categoryRows.map((c) => ({
          type: 'category' as const,
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.image_url ?? undefined,
          currency: 'USD',
        })),
      ]
    } catch {
      // Fallback to basic ILIKE if tsvector/trgm are not yet available
      const productRows = await rawQuery<{
        id: string
        name: string
        slug: string
        base_price: string
        image_url: string | null
      }>(sql`
        SELECT p.id, p.name, p.slug, p.base_price,
               pm.url AS image_url
        FROM products p
        LEFT JOIN LATERAL (
          SELECT url FROM product_media
          WHERE product_id = p.id AND is_primary = true
          LIMIT 1
        ) pm ON true
        WHERE p.is_active = true
          AND p.name ILIKE ${'%' + q + '%'}
        LIMIT ${limit}
      `)

      const categoryRows = await db
        .select({ id: categories.id, name: categories.name, slug: categories.slug, imageUrl: categories.imageUrl })
        .from(categories)
        .where(
          and(
            eq(categories.isActive, true),
            sql`${categories.name} ILIKE ${'%' + q + '%'}`,
          ),
        )
        .limit(4)

      return [
        ...productRows.map((p) => ({
          type: 'product' as const,
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.base_price),
          imageUrl: p.image_url ?? undefined,
          currency: 'USD',
        })),
        ...categoryRows.map((c) => ({
          type: 'category' as const,
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.imageUrl ?? undefined,
          currency: 'USD',
        })),
      ]
    }
  }
}

export const searchProvider = new PostgresSearchProvider()
