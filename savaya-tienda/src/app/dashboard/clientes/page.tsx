import { createAdminClient, createClient } from '@/lib/supabase/server'
import ClientesTable from '@/components/dashboard/clientes/ClientesTable'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const supabase = createAdminClient()
  const authSupabase = await createClient()
  const { data: { user: currentUser } } = await authSupabase.auth.getUser()
  const { data: currentProfile } = currentUser
    ? await authSupabase.from('profiles').select('role').eq('id', currentUser.id).single()
    : { data: null }
  const currentUserRole = currentProfile?.role ?? 'admin'

  const [profilesResult, usersResult, ordersResult] = await Promise.all([
    supabase.from('profiles').select('id, name, phone, role, created_at').order('created_at', { ascending: false }),
    supabase.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] } })),
    supabase
      .from('orders')
      .select('user_id, total, shipping_address, created_at')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false }),
  ])

  const profiles = profilesResult.data ?? []
  const users = usersResult.data?.users ?? []
  const orders = ordersResult.data ?? []

  const usersMap = new Map(users.map((u) => [u.id, u]))

  // order count + city (from most recent order per user)
  const orderCounts = new Map<string, number>()
  const userCity = new Map<string, string>()
  for (const o of orders) {
    const uid = o.user_id as string
    orderCounts.set(uid, (orderCounts.get(uid) ?? 0) + 1)
    if (!userCity.has(uid)) {
      const addr = o.shipping_address as { city?: string } | null
      if (addr?.city) userCity.set(uid, addr.city)
    }
  }

  const clients = profiles.map((p) => ({
    id: p.id as string,
    name: (p.name as string | null) ?? null,
    phone: (p.phone as string | null) ?? null,
    role: (p.role as string) ?? 'customer',
    created_at: p.created_at as string,
    email: usersMap.get(p.id)?.email ?? 'Sin email',
    last_sign_in: usersMap.get(p.id)?.last_sign_in_at ?? null,
    order_count: orderCounts.get(p.id) ?? 0,
    city: userCity.get(p.id) ?? null,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-black">Clientes</h1>
        <p className="text-gray-text text-sm mt-1">
          {clients.length} usuario{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
        </p>
      </div>
      <ClientesTable clients={clients} currentUserRole={currentUserRole} />
    </div>
  )
}
