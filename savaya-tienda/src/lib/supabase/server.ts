import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies are read-only, ignore
          }
        },
      },
    }
  )
}

/** Admin client that bypasses RLS. Uses service role key — no cookies needed. */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const ADMIN_ROLES = ['admin', 'sub_admin'] as const
type AdminRole = typeof ADMIN_ROLES[number]

function isAdminRole(role: string | undefined | null): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}

/** Throws if the calling user is not authenticated as admin or sub_admin. Use at the top of every dashboard Server Action. */
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isAdminRole(profile?.role)) throw new Error('No autorizado')
}

/** Throws if the calling user is not authenticated as admin (strict — excludes sub_admin). Use for user management operations. */
export async function requireStrictAdmin(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('No autorizado')
}

/** Throws if the caller is not admin/sub_admin or one of the additional allowed roles. */
export async function requireAdminOrRoles(...roles: string[]): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role ?? ''
  if (!isAdminRole(role) && !roles.includes(role)) throw new Error('No autorizado')
}
