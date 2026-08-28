import { NextResponse } from 'next/server'
import { auth } from '@/domains/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/shared/lib/db'
import { eq, ilike } from 'drizzle-orm'
import {
  products,
  productVariants,
  colors,
  sizes,
  categories,
} from '@/domains/catalog/schema'
import { inventory, inventoryMovements } from '@/domains/inventory/schema'
import { auditLog } from '@/domains/audit-log/schema'
import { slugify } from '@/shared/lib/slugify'
import { parseImportCsv, resolveVariantSkus } from '@/domains/admin/catalog/import-helpers'

// ---------------------------------------------------------------------------
// Public types (consumed by the client form)
// ---------------------------------------------------------------------------

export interface ImportProductResult {
  nombre: string
  status: 'created' | 'skipped' | 'error'
  variantsCreated: number
  message?: string
}

export interface ImportProductsResponse {
  total: number
  created: number
  skipped: number
  errors: number
  variantsCreated: number
  results: ImportProductResult[]
}

// ---------------------------------------------------------------------------
// POST /api/admin/catalog/import
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const permissions = (session.user.permissions ?? []) as string[]
  if (!permissions.includes('catalog:write')) {
    return NextResponse.json({ error: 'Sin permiso para importar productos' }, { status: 403 })
  }

  // ── Read file ─────────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  }
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return NextResponse.json({ error: 'Solo se aceptan archivos .csv' }, { status: 400 })
  }

  // ── Parse CSV ─────────────────────────────────────────────────────────────
  const text = await file.text()
  const groups = parseImportCsv(text)

  if (!groups.length) {
    return NextResponse.json(
      {
        error:
          'El archivo no contiene productos válidos. Asegúrate de que tenga filas con tipo "producto" y "variante".',
      },
      { status: 400 },
    )
  }

  // ── Pre-load active categories for lookup ─────────────────────────────────
  const allCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.isActive, true))

  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown'
  const actorId = session.user.id
  const actorEmail = session.user.email ?? ''

  const results: ImportProductResult[] = []

  // ── Process each product group ────────────────────────────────────────────
  for (const group of groups) {
    // Basic validation
    if (!group.nombre) {
      results.push({ nombre: '(sin nombre)', status: 'error', variantsCreated: 0, message: 'Falta el nombre del producto' })
      continue
    }
    if (!group.precioBase || group.precioBase <= 0) {
      results.push({ nombre: group.nombre, status: 'error', variantsCreated: 0, message: 'precio_base inválido o faltante' })
      continue
    }
    const validVariants = group.variants.filter((v) => v.color && v.talla)
    if (!validVariants.length) {
      results.push({ nombre: group.nombre, status: 'error', variantsCreated: 0, message: 'Sin variantes válidas (color y talla son requeridos)' })
      continue
    }

    try {
      // 1. Duplicate check
      const existing = await db
        .select({ id: products.id })
        .from(products)
        .where(ilike(products.name, group.nombre))
        .limit(1)
      if (existing.length > 0) {
        results.push({ nombre: group.nombre, status: 'skipped', variantsCreated: 0, message: 'Ya existe un producto con ese nombre' })
        continue
      }

      // 2. Category lookup
      let categoryId: string | null = null
      if (group.categoria) {
        const cat = allCategories.find(
          (c) => c.name.toLowerCase() === group.categoria.toLowerCase(),
        )
        if (!cat) {
          results.push({
            nombre: group.nombre,
            status: 'error',
            variantsCreated: 0,
            message: `Categoría "${group.categoria}" no encontrada. Créala primero en el admin.`,
          })
          continue
        }
        categoryId = cat.id
      }

      // 3. Resolve/upsert colors and sizes (outside tx — idempotent)
      const colorMap = new Map<string, string>() // colorName → colorId
      const sizeMap = new Map<string, string>()  // sizeName  → sizeId

      for (const v of validVariants) {
        if (!colorMap.has(v.color)) {
          const rows = await db
            .select({ id: colors.id })
            .from(colors)
            .where(ilike(colors.name, v.color))
            .limit(1)
          if (rows.length > 0) {
            colorMap.set(v.color, rows[0]!.id)
          } else {
            const [created] = await db
              .insert(colors)
              .values({ name: v.color, hex: v.hexColor })
              .returning({ id: colors.id })
            colorMap.set(v.color, created!.id)
          }
        }

        if (!sizeMap.has(v.talla)) {
          const rows = await db
            .select({ id: sizes.id })
            .from(sizes)
            .where(ilike(sizes.name, v.talla))
            .limit(1)
          if (rows.length > 0) {
            sizeMap.set(v.talla, rows[0]!.id)
          } else {
            const [created] = await db
              .insert(sizes)
              .values({ name: v.talla, sortOrder: 0 })
              .returning({ id: sizes.id })
            sizeMap.set(v.talla, created!.id)
          }
        }
      }

      // 4. Generate variant SKUs
      const skuMap = resolveVariantSkus(validVariants, slugify(group.nombre))

      // 5. Ensure unique slug
      const baseSlug = slugify(group.nombre)
      let slug = baseSlug
      const slugConflict = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1)
      if (slugConflict.length > 0) {
        slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      }

      // 6. Transaction: product + variants + inventory
      let variantsCreated = 0

      await db.transaction(async (tx) => {
        const [prod] = await tx
          .insert(products)
          .values({
            name: group.nombre,
            slug,
            description: group.descripcion,
            categoryId,
            gender: group.genero,
            basePrice: String(group.precioBase),
            compareAtPrice:
              group.precioComparacion != null ? String(group.precioComparacion) : null,
            isActive: false,
            isFeatured: false,
            isNew: false,
            publishedAt: null,
          })
          .returning({ id: products.id })

        const productId = prod!.id

        for (const v of validVariants) {
          const colorId = colorMap.get(v.color)!
          const sizeId = sizeMap.get(v.talla)!
          const sku = skuMap.get(v)!
          const price = v.precio ?? group.precioBase

          const [variant] = await tx
            .insert(productVariants)
            .values({
              productId,
              colorId,
              sizeId,
              sku,
              price: String(price),
              isActive: true,
            })
            .returning({ id: productVariants.id })

          await tx.insert(inventory).values({
            variantId: variant!.id,
            quantity: v.cantidad,
            reserved: 0,
          })

          if (v.cantidad > 0) {
            await tx.insert(inventoryMovements).values({
              variantId: variant!.id,
              type: 'purchase',
              quantity: v.cantidad,
              reason: 'Importación masiva CSV',
              performedBy: actorId,
            })
          }

          variantsCreated++
        }

        await tx.insert(auditLog).values({
          actorId,
          actorEmail,
          action: 'product.bulk_import',
          resourceType: 'product',
          resourceId: productId,
          after: { name: group.nombre, variantsCreated, slug },
          ip,
        })
      })

      results.push({ nombre: group.nombre, status: 'created', variantsCreated })
    } catch (e) {
      results.push({
        nombre: group.nombre,
        status: 'error',
        variantsCreated: 0,
        message: e instanceof Error ? e.message : 'Error desconocido',
      })
    }
  }

  return NextResponse.json({
    total: results.length,
    created: results.filter((r) => r.status === 'created').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    errors: results.filter((r) => r.status === 'error').length,
    variantsCreated: results.reduce((s, r) => s + r.variantsCreated, 0),
    results,
  } satisfies ImportProductsResponse)
}
