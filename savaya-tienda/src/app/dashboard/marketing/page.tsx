import { createAdminClient } from '@/lib/supabase/server'
import MarketingDashboard, { type ClientData } from '@/components/dashboard/marketing/MarketingDashboard'

export const dynamic = 'force-dynamic'

export default async function MarketingPage() {
  const supabase = createAdminClient()

  // Fetch all data in parallel (join in JS for reliability)
  const [ordersRes, itemsRes, variantsRes, productsRes, profilesRes] = await Promise.all([
    supabase.from('orders').select('id, email, user_id, total, created_at'),
    supabase.from('order_items').select('order_id, variant_id'),
    supabase.from('product_variants').select('id, product_id'),
    supabase.from('products').select('id, gender, type'),
    supabase.from('profiles').select('id, name, phone'),
  ])

  const orders = ordersRes.data ?? []
  const items = itemsRes.data ?? []
  const variants = variantsRes.data ?? []
  const products = productsRes.data ?? []
  const profiles = profilesRes.data ?? []

  // Lookup maps
  const variantToProductId = new Map(variants.map((v) => [v.id as string, v.product_id as string]))
  const productInfo = new Map(
    products.map((p) => [p.id as string, { gender: p.gender as string, type: p.type as string }])
  )
  const profileInfo = new Map(
    profiles.map((p) => [p.id as string, { name: p.name as string | null, phone: p.phone as string | null }])
  )

  // order_id → { genders, types } (unique per order)
  const orderDetails = new Map<string, { genders: Set<string>; types: Set<string> }>()
  for (const item of items) {
    const oid = item.order_id as string
    if (!orderDetails.has(oid)) orderDetails.set(oid, { genders: new Set(), types: new Set() })
    const productId = variantToProductId.get(item.variant_id as string)
    if (productId) {
      const info = productInfo.get(productId)
      if (info?.gender) orderDetails.get(oid)!.genders.add(info.gender)
      if (info?.type) orderDetails.get(oid)!.types.add(info.type)
    }
  }

  // Group orders by email → ClientData
  const clientMap = new Map<string, ClientData>()
  for (const order of orders) {
    const email = (order.email as string).toLowerCase().trim()
    if (!email) continue

    if (!clientMap.has(email)) {
      const profile = order.user_id ? profileInfo.get(order.user_id as string) : null
      clientMap.set(email, {
        email: order.email as string,
        name: profile?.name ?? null,
        phone: profile?.phone ?? null,
        totalSpent: 0,
        orderCount: 0,
        lastOrderAt: null,
        genders: [],
        types: [],
      })
    }

    const client = clientMap.get(email)!
    client.orderCount++
    client.totalSpent += (order.total as number) ?? 0

    const details = orderDetails.get(order.id as string)
    if (details) {
      for (const g of details.genders) if (!client.genders.includes(g)) client.genders.push(g)
      for (const t of details.types) if (!client.types.includes(t)) client.types.push(t)
    }

    const d = order.created_at as string
    if (!client.lastOrderAt || d > client.lastOrderAt) client.lastOrderAt = d
  }

  const clients = [...clientMap.values()]

  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0
    ? orders.reduce((s, o) => s + ((o.total as number) ?? 0), 0) / totalOrders
    : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-black">Marketing</h1>
        <p className="text-gray-text text-sm mt-1">
          Segmentos automáticos basados en el historial de compras — exporta emails o teléfonos para tus campañas.
        </p>
      </div>
      <MarketingDashboard
        clients={clients}
        totalOrders={totalOrders}
        avgOrderValue={avgOrderValue}
      />
    </div>
  )
}
