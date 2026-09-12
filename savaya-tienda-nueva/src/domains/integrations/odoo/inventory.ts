import { authenticate, callKw, OdooError } from './client'

export type StockItem = {
  sku: string
  qty: number
}

type OdooProduct = {
  id: number
  default_code: string | false
}

type OdooQuant = {
  product_id: [number, string]
  qty_on_hand: number
}

function getLocationDomain(): unknown[] | null {
  const locationId = process.env.ODOO_STOCK_LOCATION_ID
  if (locationId) return ['location_id', '=', parseInt(locationId, 10)]
  return ['location_id.usage', '=', 'internal']
}

// Returns stock levels for ALL products that have a SKU (default_code) in Odoo.
// Uses two queries: products with SKU → their stock.quant rows.
export async function getAllStockLevels(): Promise<StockItem[]> {
  const session = await authenticate()

  // Step 1: get all products that have a default_code (SKU)
  const products = await callKw<OdooProduct[]>(
    session,
    'product.product',
    'search_read',
    [[['default_code', '!=', false]]],
    { fields: ['id', 'default_code'], limit: 0 },
  )

  if (products.length === 0) return []

  const skuById = new Map<number, string>()
  const productIds: number[] = []

  for (const p of products) {
    if (p.default_code) {
      skuById.set(p.id, p.default_code)
      productIds.push(p.id)
    }
  }

  // Step 2: get stock quantities for those product IDs
  const locationFilter = getLocationDomain()
  const quants = await callKw<OdooQuant[]>(
    session,
    'stock.quant',
    'search_read',
    [[
      ['product_id', 'in', productIds],
      locationFilter,
    ]],
    { fields: ['product_id', 'qty_on_hand'], limit: 0 },
  )

  // Aggregate by SKU (a variant can exist in multiple locations)
  const bySkuMap = new Map<string, number>()
  for (const q of quants) {
    const sku = skuById.get(q.product_id[0])
    if (!sku) continue
    bySkuMap.set(sku, (bySkuMap.get(sku) ?? 0) + q.qty_on_hand)
  }

  // Also include products with qty=0 (not in stock.quant) as 0
  for (const sku of skuById.values()) {
    if (!bySkuMap.has(sku)) bySkuMap.set(sku, 0)
  }

  return Array.from(bySkuMap.entries()).map(([sku, qty]) => ({
    sku,
    qty: Math.max(0, Math.floor(qty)),
  }))
}

// Returns stock for specific SKUs only — used by the webhook endpoint.
export async function getStockBySku(skus: string[]): Promise<StockItem[]> {
  if (skus.length === 0) return []

  const session = await authenticate()

  const products = await callKw<OdooProduct[]>(
    session,
    'product.product',
    'search_read',
    [[['default_code', 'in', skus]]],
    { fields: ['id', 'default_code'], limit: 0 },
  )

  if (products.length === 0) return []

  const skuById = new Map<number, string>()
  const productIds: number[] = []

  for (const p of products) {
    if (p.default_code) {
      skuById.set(p.id, p.default_code)
      productIds.push(p.id)
    }
  }

  const locationFilter = getLocationDomain()
  const quants = await callKw<OdooQuant[]>(
    session,
    'stock.quant',
    'search_read',
    [[
      ['product_id', 'in', productIds],
      locationFilter,
    ]],
    { fields: ['product_id', 'qty_on_hand'], limit: 0 },
  )

  const bySkuMap = new Map<string, number>()
  for (const sku of skus) bySkuMap.set(sku, 0) // default to 0

  for (const q of quants) {
    const sku = skuById.get(q.product_id[0])
    if (!sku) continue
    bySkuMap.set(sku, (bySkuMap.get(sku) ?? 0) + q.qty_on_hand)
  }

  return Array.from(bySkuMap.entries()).map(([sku, qty]) => ({
    sku,
    qty: Math.max(0, Math.floor(qty)),
  }))
}
