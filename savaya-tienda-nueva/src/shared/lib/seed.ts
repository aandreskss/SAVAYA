/**
 * SAVAYA — Database seed script
 *
 * Inserts base configuration data required for the store to operate.
 * Safe to run on a fresh database. Aborts if sizes already exist
 * to prevent accidental double-seeding.
 *
 * Development (includes sample products):
 *   npx tsx src/shared/lib/seed.ts
 *
 * Production (skips sample products):
 *   npx tsx src/shared/lib/seed.ts --production
 *
 * DO NOT run in production without explicit confirmation.
 * The guard at the top of main() will abort if sizes already exist.
 */

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'

import { sizes } from '@/domains/catalog/schema'
import { colors } from '@/domains/catalog/schema'
import { categories } from '@/domains/catalog/schema'
import { products, productVariants } from '@/domains/catalog/schema'
import { paymentMethods } from '@/domains/payment-methods/schema'
import {
  shippingZones,
  shippingCities,
  shippingMethods,
  shippingRates,
} from '@/domains/shipping/schema'
import { applicationSettings } from '@/domains/settings/schema'
import { inventory, inventoryMovements } from '@/domains/inventory/schema'
import { pages, pageSections } from '@/domains/cms/schema'
import {
  roles,
  permissions,
  rolePermissions,
} from '@/domains/roles-permissions/schema'
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/domains/roles-permissions/permissions'

// ---------------------------------------------------------------------------
// DB connection (direct — not pooled, seed runs outside serverless context)
// ---------------------------------------------------------------------------

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client)

const IS_PRODUCTION = process.argv.includes('--production')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SIZES_DATA = [
  { name: '35', sortOrder: 1 },
  { name: '36', sortOrder: 2 },
  { name: '37', sortOrder: 3 },
  { name: '38', sortOrder: 4 },
  { name: '39', sortOrder: 5 },
  { name: '40', sortOrder: 6 },
]

// 19 colors validated with SAVAYA — using DATABASE.md values (authoritative)
const COLORS_DATA = [
  { name: 'Negro', hex: '#111111' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Beige', hex: '#D4B896' },
  { name: 'Café', hex: '#6B3F2A' },
  { name: 'Camel', hex: '#C19A6B' },
  { name: 'Gris', hex: '#9E9E9E' },
  { name: 'Plateado', hex: '#C0C0C0' },
  { name: 'Dorado', hex: '#C9A227' },
  { name: 'Rosado', hex: '#F4A7B9' },
  { name: 'Rojo', hex: '#C0362C' },
  { name: 'Azul', hex: '#1E3A8A' },
  { name: 'Azul marino', hex: '#172554' },
  { name: 'Verde', hex: '#1E7F4F' },
  { name: 'Mostaza', hex: '#B8791A' },
  { name: 'Naranja', hex: '#EA580C' },
  { name: 'Lila', hex: '#A855F7' },
  { name: 'Nude', hex: '#E8C9A5' },
  { name: 'Multicolor', hex: null },
  { name: 'Estampado', hex: null },
]

// Women's shoe categories (parentId: null — top level)
const CATEGORIES_DATA = [
  'Sandalias',
  'Tacones',
  'Plataformas',
  'Flats',
  'Botas',
  'Sneakers',
  'Mules',
]

// Application settings — all configurable from admin without deploy
const SETTINGS_DATA = [
  {
    key: 'reservation_expiry_hours',
    value: '24',
    description: 'Horas antes de que expire la reserva de inventario de un pedido en PENDING_PAYMENT',
  },
  {
    key: 'partial_payment_options',
    value: '20,35,50',
    description: 'Porcentajes disponibles para reserva parcial (adelanto). Separados por coma.',
  },
  {
    key: 'free_shipping_threshold_usd',
    value: '80',
    description: 'Monto mínimo en USD a partir del cual el envío es gratis',
  },
  {
    key: 'standard_shipping_cost_usd',
    value: '5',
    description: 'Costo de envío estándar nacional en USD',
  },
  {
    key: 'express_shipping_cost_usd',
    value: '10',
    description: 'Costo de envío express nacional en USD',
  },
  {
    key: 'store_whatsapp',
    value: '584141100100',
    description: 'Número de WhatsApp de la tienda en formato internacional sin +',
  },
  {
    key: 'usdt_policy',
    value: 'pending',
    description: 'Política de tasa USDT: "1:1" usa 1 USDT = 1 USD. Configurar antes de activar el método en producción.',
  },
  {
    key: 'store_name',
    value: 'Savaya',
    description: 'Nombre de la tienda',
  },
  {
    key: 'store_tagline',
    value: 'Marca tu moda',
    description: 'Tagline de la tienda',
  },
  {
    key: 'store_email',
    value: 'Savayarrss@gmail.com',
    description: 'Email de contacto de la tienda',
  },
  {
    key: 'store_instagram',
    value: '@Savayavzla',
    description: 'Instagram de la tienda',
  },
  {
    key: 'store_address',
    value: 'Calle 73, CC Multi Tienda God is Good, local A-4, Valencia, Carabobo',
    description: 'Dirección física de la tienda',
  },
  {
    key: 'low_stock_threshold',
    value: '3',
    description: 'Cantidad mínima de unidades antes de mostrar alerta de stock bajo',
  },
  {
    key: 'order_number_prefix',
    value: 'SAV',
    description: 'Prefijo del número de pedido (ej. SAV-000001)',
  },
]

// Carabobo municipalities with local delivery (14)
const CARABOBO_MUNICIPALITIES = [
  'Valencia',
  'Naguanagua',
  'San Diego',
  'Libertador',
  'Los Guayos',
  'Guacara',
  'San Joaquín',
  'Bejuma',
  'Montalbán',
  'Miranda',
  'Puerto Cabello',
  'Carlos Arvelo',
  'Diego Ibarra',
  'Juan José Mora',
]

// National coverage cities (21)
const NATIONAL_CITIES = [
  { name: 'Caracas', state: 'Distrito Capital' },
  { name: 'Valencia', state: 'Carabobo' },
  { name: 'Maracay', state: 'Aragua' },
  { name: 'Barquisimeto', state: 'Lara' },
  { name: 'Puerto La Cruz', state: 'Anzoátegui' },
  { name: 'Puerto Ordaz', state: 'Bolívar' },
  { name: 'Barinas', state: 'Barinas' },
  { name: 'San Cristóbal', state: 'Táchira' },
  { name: 'Mérida', state: 'Mérida' },
  { name: 'Maracaibo', state: 'Zulia' },
  { name: 'Acarigua', state: 'Portuguesa' },
  { name: 'San Félix', state: 'Bolívar' },
  { name: 'Guanare', state: 'Portuguesa' },
  { name: 'El Tigre', state: 'Anzoátegui' },
  { name: 'Cantaura', state: 'Anzoátegui' },
  { name: 'Puerto Cabello', state: 'Carabobo' },
  { name: 'Valera', state: 'Trujillo' },
  { name: 'Trujillo', state: 'Trujillo' },
  { name: 'Maturín', state: 'Monagas' },
  { name: 'Upata', state: 'Bolívar' },
  { name: 'Valle la Pascua', state: 'Guárico' },
]

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 SAVAYA seed — iniciando...')

  // Guard: abort if sizes already exist
  const existingSizes = await db.select().from(sizes).limit(1)
  if (existingSizes.length > 0) {
    console.error(
      '❌ La base de datos ya tiene datos (sizes encontradas). Abortando seed para evitar duplicados.',
    )
    console.error('   Si necesitas resetear los datos, hazlo manualmente primero.')
    process.exit(1)
  }

  // -------------------------------------------------------------------------
  // 1. Sizes
  // -------------------------------------------------------------------------
  console.log('  → Insertando tallas...')
  const insertedSizes = await db.insert(sizes).values(SIZES_DATA).returning()
  const sizeMap = new Map(insertedSizes.map((s) => [s.name, s.id]))
  console.log(`     ✓ ${insertedSizes.length} tallas`)

  // -------------------------------------------------------------------------
  // 2. Colors
  // -------------------------------------------------------------------------
  console.log('  → Insertando colores...')
  const insertedColors = await db
    .insert(colors)
    .values(COLORS_DATA)
    .returning()
  const colorMap = new Map(insertedColors.map((c) => [c.name, c.id]))
  console.log(`     ✓ ${insertedColors.length} colores`)

  // -------------------------------------------------------------------------
  // 3. Categories (women's, top-level)
  // -------------------------------------------------------------------------
  console.log('  → Insertando categorías...')
  const categoriesData = CATEGORIES_DATA.map((name) => ({
    name,
    slug: slug(name),
    isActive: true,
    sortOrder: CATEGORIES_DATA.indexOf(name) + 1,
  }))
  const insertedCategories = await db
    .insert(categories)
    .values(categoriesData)
    .returning()
  const categoryMap = new Map(insertedCategories.map((c) => [c.name, c.id]))
  console.log(`     ✓ ${insertedCategories.length} categorías`)

  // -------------------------------------------------------------------------
  // 4. Payment methods
  // -------------------------------------------------------------------------
  console.log('  → Insertando métodos de pago...')
  const paymentMethodsData = [
    {
      name: 'Zelle',
      type: 'zelle' as const,
      currency: 'usd' as const,
      isActive: true,
      instructions:
        'Realiza tu transferencia Zelle al email o teléfono indicado. Guarda el comprobante con la referencia de confirmación.',
      accountDetails: {},
      sortOrder: 1,
    },
    {
      name: 'Pago Móvil',
      type: 'pago_movil' as const,
      currency: 'ves' as const,
      isActive: true,
      instructions:
        'Realiza tu pago móvil al banco, teléfono y cédula indicados. Incluye tu cédula en la referencia.',
      accountDetails: {},
      sortOrder: 2,
    },
    {
      name: 'Transferencia Bancaria',
      type: 'bank_transfer' as const,
      currency: 'ves' as const,
      isActive: true,
      instructions:
        'Realiza la transferencia a la cuenta indicada. Envía el comprobante con la referencia bancaria.',
      accountDetails: {},
      sortOrder: 3,
    },
    {
      name: 'USDT TRC20',
      type: 'usdt_trc20' as const,
      currency: 'usd' as const,
      isActive: true,
      instructions:
        'Envía USDT por la red TRC20 a la dirección de wallet indicada. Incluye el hash de la transacción.',
      accountDetails: {},
      sortOrder: 4,
    },
    {
      name: 'Binance Pay',
      type: 'binance_pay' as const,
      currency: 'usd' as const,
      isActive: true,
      instructions:
        'Envía el pago a nuestro Pay ID de Binance. Adjunta la captura de confirmación.',
      accountDetails: {},
      sortOrder: 5,
    },
    {
      name: 'Efectivo',
      type: 'cash' as const,
      currency: 'usd' as const,
      isActive: true,
      instructions:
        'Solo disponible para retiro en tienda. Cancela en el local al retirar tu pedido. Dirección: CC Multi Tienda God is Good, local A-4, Valencia, Carabobo.',
      accountDetails: {},
      sortOrder: 6,
    },
  ]
  const insertedPaymentMethods = await db
    .insert(paymentMethods)
    .values(paymentMethodsData)
    .returning()
  console.log(`     ✓ ${insertedPaymentMethods.length} métodos de pago`)

  // -------------------------------------------------------------------------
  // 5. Shipping zones, cities, methods & rates
  // -------------------------------------------------------------------------
  console.log('  → Insertando zonas de envío...')

  // Zone 1: Local delivery Carabobo
  const [caraboboZone] = await db
    .insert(shippingZones)
    .values({
      name: 'Delivery Carabobo',
      type: 'local_delivery',
      isActive: true,
      sortOrder: 1,
    })
    .returning()

  const caraboboCitiesData = CARABOBO_MUNICIPALITIES.map((name) => ({
    zoneId: caraboboZone.id,
    name,
    state: 'Carabobo',
    isActive: true,
  }))
  await db.insert(shippingCities).values(caraboboCitiesData)

  const [caraboboMethod] = await db
    .insert(shippingMethods)
    .values({
      zoneId: caraboboZone.id,
      name: 'Delivery a domicilio',
      provider: null,
      estimatedDays: 1,
      isActive: true,
    })
    .returning()

  // Default rate for Carabobo delivery — configurable per city from admin
  await db.insert(shippingRates).values({
    methodId: caraboboMethod.id,
    cityId: null,
    minOrderUsd: '0',
    maxOrderUsd: null,
    rateUsd: '3',
    freeShippingThresholdUsd: '80',
  })

  // Zone 2: National agency (Zoom, Tealca, MRW)
  const [nationalZone] = await db
    .insert(shippingZones)
    .values({
      name: 'Envío Nacional',
      type: 'national_agency',
      isActive: true,
      sortOrder: 2,
    })
    .returning()

  const nationalCitiesData = NATIONAL_CITIES.map((city) => ({
    zoneId: nationalZone.id,
    name: city.name,
    state: city.state,
    isActive: true,
  }))
  await db.insert(shippingCities).values(nationalCitiesData)

  const nationalProviders = [
    { name: 'Zoom', provider: 'Zoom', estimatedDays: 3 },
    { name: 'Tealca', provider: 'Tealca', estimatedDays: 3 },
    { name: 'MRW', provider: 'MRW', estimatedDays: 4 },
  ]

  for (const providerData of nationalProviders) {
    const [method] = await db
      .insert(shippingMethods)
      .values({ zoneId: nationalZone.id, isActive: true, ...providerData })
      .returning()

    await db.insert(shippingRates).values({
      methodId: method.id,
      cityId: null,
      minOrderUsd: '0',
      maxOrderUsd: null,
      rateUsd: '5',
      freeShippingThresholdUsd: '80',
    })
  }

  // Zone 3: Pickup (free)
  const [pickupZone] = await db
    .insert(shippingZones)
    .values({
      name: 'Retiro en Tienda',
      type: 'pickup',
      isActive: true,
      sortOrder: 3,
    })
    .returning()

  const [pickupMethod] = await db
    .insert(shippingMethods)
    .values({
      zoneId: pickupZone.id,
      name: 'Retiro en local',
      provider: null,
      estimatedDays: 0,
      isActive: true,
    })
    .returning()

  await db.insert(shippingRates).values({
    methodId: pickupMethod.id,
    cityId: null,
    minOrderUsd: '0',
    maxOrderUsd: null,
    rateUsd: '0',
    freeShippingThresholdUsd: null,
  })

  console.log('     ✓ 3 zonas de envío + ciudades + métodos + tarifas')

  // -------------------------------------------------------------------------
  // 6. Application settings
  // -------------------------------------------------------------------------
  console.log('  → Insertando configuración de la aplicación...')
  await db.insert(applicationSettings).values(SETTINGS_DATA)
  console.log(`     ✓ ${SETTINGS_DATA.length} claves de configuración`)

  // -------------------------------------------------------------------------
  // 7. Roles and permissions (RBAC)
  // -------------------------------------------------------------------------
  console.log('  → Insertando roles y permisos...')

  // Insert all roles
  const roleNames = Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]
  const insertedRoles = await db
    .insert(roles)
    .values(
      roleNames.map((name, i) => ({
        name: name as 'super_admin' | 'admin' | 'catalog' | 'inventory' | 'sales' | 'finance' | 'customer_service' | 'marketing' | 'analyst',
        description: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        isSystem: true,
      }))
    )
    .onConflictDoNothing()
    .returning()
  const roleMap = new Map(insertedRoles.map((r) => [r.name, r.id]))

  // Insert all permission slugs
  const permissionSlugs = Object.values(PERMISSIONS)
  const permissionData = permissionSlugs.map((slug) => {
    const [resource, action] = slug.split(':')
    return { resource, action }
  })
  const insertedPermissions = await db
    .insert(permissions)
    .values(permissionData)
    .onConflictDoNothing()
    .returning()
  const permMap = new Map(insertedPermissions.map((p) => [`${p.resource}:${p.action}`, p.id]))

  // Map roles → permissions
  const rpValues: { roleId: string; permissionId: string }[] = []
  for (const [roleName, permList] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap.get(roleName as Parameters<typeof roleMap.get>[0])
    if (!roleId) continue
    for (const slug of permList) {
      const permId = permMap.get(slug)
      if (permId) rpValues.push({ roleId, permissionId: permId })
    }
  }
  if (rpValues.length > 0) {
    await db.insert(rolePermissions).values(rpValues).onConflictDoNothing()
  }
  console.log(`     ✓ ${insertedRoles.length} roles, ${insertedPermissions.length} permisos, ${rpValues.length} asignaciones`)

  // -------------------------------------------------------------------------
  // 8. Sample products (development only)
  // -------------------------------------------------------------------------
  if (IS_PRODUCTION) {
    console.log('  ⏭ --production: omitiendo productos de ejemplo')
  } else {
  console.log('  → Insertando productos de ejemplo (solo desarrollo)...')

  const sandaliaCategoryId = categoryMap.get('Sandalias')!
  const taconCategoryId = categoryMap.get('Tacones')!
  const negroId = colorMap.get('Negro')!
  const beigeId = colorMap.get('Beige')!
  const vinoId = colorMap.get('Rojo')! // Usando Rojo como proxy de Vino para seed
  const size36Id = sizeMap.get('36')!
  const size37Id = sizeMap.get('37')!
  const size38Id = sizeMap.get('38')!
  const size39Id = sizeMap.get('39')!

  // Product 1: Sandalia Punta Fina
  const [sandalia] = await db
    .insert(products)
    .values({
      name: 'Sandalia Punta Fina',
      slug: 'sandalia-punta-fina',
      description: 'Sandalia de punta fina con acabado elegante. Perfecta para cualquier ocasión.',
      categoryId: sandaliaCategoryId,
      gender: 'women',
      productType: 'shoes',
      basePrice: '45.00',
      isActive: true,
      isFeatured: true,
      isNew: true,
      publishedAt: new Date(),
    })
    .returning()

  // Variants: Negro × [36,37,38], Beige × [36,37,38]
  const sandaliaVariantsData = [
    { colorId: negroId, sizeId: size36Id, sku: 'SPF-NEG-36', price: '45.00' },
    { colorId: negroId, sizeId: size37Id, sku: 'SPF-NEG-37', price: '45.00' },
    { colorId: negroId, sizeId: size38Id, sku: 'SPF-NEG-38', price: '45.00' },
    { colorId: beigeId, sizeId: size36Id, sku: 'SPF-BEI-36', price: '45.00' },
    { colorId: beigeId, sizeId: size37Id, sku: 'SPF-BEI-37', price: '45.00' },
    { colorId: beigeId, sizeId: size38Id, sku: 'SPF-BEI-38', price: '45.00' },
  ].map((v) => ({ ...v, productId: sandalia.id, isActive: true }))

  const insertedSandaliaVariants = await db
    .insert(productVariants)
    .values(sandaliaVariantsData)
    .returning()

  // Inventory: 10 units per variant
  await db.insert(inventory).values(
    insertedSandaliaVariants.map((v) => ({
      variantId: v.id,
      quantity: 10,
      reserved: 0,
    })),
  )
  await db.insert(inventoryMovements).values(
    insertedSandaliaVariants.map((v) => ({
      variantId: v.id,
      type: 'purchase' as const,
      quantity: 10,
      reason: 'Stock inicial — seed de desarrollo',
    })),
  )

  // Product 2: Tacón Clásico
  const [tacon] = await db
    .insert(products)
    .values({
      name: 'Tacón Clásico',
      slug: 'tacon-clasico',
      description: 'Tacón clásico de altura media. Versatil y cómodo para el día a día.',
      categoryId: taconCategoryId,
      gender: 'women',
      productType: 'shoes',
      basePrice: '55.00',
      isActive: true,
      isFeatured: false,
      isNew: true,
      publishedAt: new Date(),
    })
    .returning()

  // Variants: Negro × [36,37,38,39], Rojo × [36,37,38,39]
  const taconVariantsData = [
    { colorId: negroId, sizeId: size36Id, sku: 'TCL-NEG-36', price: '55.00' },
    { colorId: negroId, sizeId: size37Id, sku: 'TCL-NEG-37', price: '55.00' },
    { colorId: negroId, sizeId: size38Id, sku: 'TCL-NEG-38', price: '55.00' },
    { colorId: negroId, sizeId: size39Id, sku: 'TCL-NEG-39', price: '55.00' },
    { colorId: vinoId, sizeId: size36Id, sku: 'TCL-ROJ-36', price: '55.00' },
    { colorId: vinoId, sizeId: size37Id, sku: 'TCL-ROJ-37', price: '55.00' },
    { colorId: vinoId, sizeId: size38Id, sku: 'TCL-ROJ-38', price: '55.00' },
    { colorId: vinoId, sizeId: size39Id, sku: 'TCL-ROJ-39', price: '55.00' },
  ].map((v) => ({ ...v, productId: tacon.id, isActive: true }))

  const insertedTaconVariants = await db
    .insert(productVariants)
    .values(taconVariantsData)
    .returning()

  // Inventory: 10 units per variant
  await db.insert(inventory).values(
    insertedTaconVariants.map((v) => ({
      variantId: v.id,
      quantity: 10,
      reserved: 0,
    })),
  )
  await db.insert(inventoryMovements).values(
    insertedTaconVariants.map((v) => ({
      variantId: v.id,
      type: 'purchase' as const,
      quantity: 10,
      reason: 'Stock inicial — seed de desarrollo',
    })),
  )

  console.log('     ✓ 2 productos de ejemplo con variantes e inventario inicial')
  } // end if (!IS_PRODUCTION)

  // -------------------------------------------------------------------------
  // 9. Home CMS content
  // -------------------------------------------------------------------------
  await seedHomeContent(categoryMap)

  // -------------------------------------------------------------------------
  // Done
  // -------------------------------------------------------------------------
  console.log('')
  console.log('✅ Seed completado exitosamente.')
  console.log('   Tablas pobladas:')
  console.log(`   - sizes: ${insertedSizes.length}`)
  console.log(`   - colors: ${insertedColors.length}`)
  console.log(`   - categories: ${insertedCategories.length}`)
  console.log(`   - payment_methods: ${insertedPaymentMethods.length}`)
  console.log('   - shipping_zones: 3 (Carabobo + Nacional + Retiro)')
  console.log(`   - application_settings: ${SETTINGS_DATA.length}`)
  console.log('   - roles: 9 | permissions: 30 | role_permissions: asignadas')
  if (!IS_PRODUCTION) {
    console.log('   - products: 2 (solo desarrollo)')
  }
  console.log('   - pages + page_sections: home (5 secciones)')
  if (IS_PRODUCTION) {
    console.log('')
    console.log('📋 Próximos pasos en producción:')
    console.log('   1. Ejecutar: npx tsx scripts/create-admin.ts')
    console.log('   2. Ingresar al admin y configurar datos de métodos de pago')
    console.log('   3. Cargar el catálogo de productos reales desde /admin/productos')
    console.log('   4. Configurar imágenes hero y banners desde /admin/contenido')
  }

  await client.end()
}

// ---------------------------------------------------------------------------
// seedHomeContent — inserts home page CMS blocks
// ---------------------------------------------------------------------------

/**
 * Inserts the home page and its initial CMS sections.
 * Safe to call after main() has already run (categories must exist).
 * Skips silently if the home page already exists.
 *
 * @param categoryMap  Map<name, id> produced by the main seed
 */
async function seedHomeContent(categoryMap: Map<string, string>): Promise<void> {
  console.log('  → Insertando contenido de la Home (CMS)...')

  // Guard: skip if home page already exists
  const existing = await db.select().from(pages).where(eq(pages.slug, 'home')).limit(1)
  if (existing.length > 0) {
    console.log('     ⚠ Página home ya existe — omitiendo seed de CMS.')
    return
  }

  // 1. Create the home page record
  const [homePage] = await db
    .insert(pages)
    .values({ slug: 'home', title: 'Home', isActive: true })
    .returning()

  // 2. Build sections

  // AnnouncementBar (sortOrder 0)
  const announcementContent = {
    text: 'Envíos a todo Venezuela desde Valencia, Carabobo. ¡Compra ahora!',
    linkText: 'Ver colección',
    linkHref: '/coleccion',
    bgColor: 'brand-black',
  }

  // Hero (sortOrder 1)
  const heroContent = {
    headline: 'Marca tu moda',
    subheadline: 'Calzado femenino venezolano. Tallas 35 al 40.',
    ctaPrimaryText: 'Ver colección',
    ctaPrimaryHref: '/coleccion',
    ctaSecondaryText: 'Novedades',
    ctaSecondaryHref: '/nuevo',
    imageDesktopUrl:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1920&q=80',
    imageMobileUrl:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=768&q=80',
    imageAlt: 'Colección SAVAYA — calzado femenino venezolano',
    overlayOpacity: 0.35,
  }

  // ShopByCategory — uses category slugs from seed (sortOrder 2)
  const shopByCategoryContent = {
    title: 'Compra por categoría',
    categories: [
      {
        name: 'Sandalias',
        slug: 'sandalias',
        imageUrl:
          'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&q=80',
      },
      {
        name: 'Tacones',
        slug: 'tacones',
        imageUrl:
          'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=600&q=80',
      },
      {
        name: 'Plataformas',
        slug: 'plataformas',
        imageUrl:
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80',
      },
      {
        name: 'Flats',
        slug: 'flats',
        imageUrl:
          'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80',
      },
    ].filter((c) => categoryMap.has(c.name)),
  }

  // ProductCarousel — new arrivals (sortOrder 3)
  const productCarouselContent = {
    title: 'Nuevos ingresos',
    subtitle: 'Lo último en calzado SAVAYA',
    source: 'new',
    limit: 8,
    ctaText: 'Ver todos',
    ctaHref: '/nuevo',
  }

  // BenefitsBlock (sortOrder 4)
  const benefitsContent = {
    benefits: [
      {
        icon: 'truck',
        title: 'Envíos a todo Venezuela',
        description: 'Despachamos por Zoom, Tealca y MRW desde Valencia, Carabobo.',
      },
      {
        icon: 'whatsapp',
        title: 'Atención por WhatsApp',
        description: 'Respuesta rápida de lunes a sábado de 9 am a 6 pm.',
      },
      {
        icon: 'refresh',
        title: 'Cambios en 7 días',
        description: 'Si el calzado no es tu talla, realizamos el cambio sin costo adicional.',
      },
      {
        icon: 'shield',
        title: 'Compra segura',
        description: 'Múltiples métodos de pago verificados. Tu pedido está protegido.',
      },
    ],
  }

  // 3. Insert all sections
  await db.insert(pageSections).values([
    {
      pageId: homePage.id,
      type: 'announcement_bar',
      content: announcementContent,
      sortOrder: 0,
      isActive: true,
    },
    {
      pageId: homePage.id,
      type: 'hero',
      content: heroContent,
      sortOrder: 1,
      isActive: true,
    },
    {
      pageId: homePage.id,
      type: 'shop_by_category',
      content: shopByCategoryContent,
      sortOrder: 2,
      isActive: true,
    },
    {
      pageId: homePage.id,
      type: 'product_carousel',
      content: productCarouselContent,
      sortOrder: 3,
      isActive: true,
    },
    {
      pageId: homePage.id,
      type: 'benefits_block',
      content: benefitsContent,
      sortOrder: 4,
      isActive: true,
    },
  ])

  console.log('     ✓ Página home + 5 secciones CMS insertadas')
}

main().catch((err) => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
