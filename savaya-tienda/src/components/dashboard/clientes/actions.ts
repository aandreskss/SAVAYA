'use server'

import { createClient, createAdminClient, requireStrictAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Roles that admin can assign via the UI (never 'admin' — set directly in DB)
const ADMIN_ASSIGNABLE_ROLES = ['customer', 'sub_admin', 'editor', 'gestor_pedidos'] as const
type AdminAssignableRole = typeof ADMIN_ASSIGNABLE_ROLES[number]

// Roles that sub_admin can assign (never 'admin' or 'sub_admin')
const SUB_ADMIN_ASSIGNABLE_ROLES = ['customer', 'editor', 'gestor_pedidos'] as const
type SubAdminAssignableRole = typeof SUB_ADMIN_ASSIGNABLE_ROLES[number]

/**
 * Update only the role of a user.
 * Returns { error } instead of throwing so the client can handle it gracefully.
 */
export async function updateUserRole(userId: string, role: string): Promise<{ error?: string }> {
  try {
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { data: callerProfile } = await authSupabase
      .from('profiles').select('role').eq('id', user.id).single()
    const callerRole = callerProfile?.role

    const supabase = createAdminClient()

    if (callerRole === 'admin') {
      if (!ADMIN_ASSIGNABLE_ROLES.includes(role as AdminAssignableRole))
        return { error: `Rol no permitido: ${role}` }
    } else if (callerRole === 'sub_admin') {
      if (!SUB_ADMIN_ASSIGNABLE_ROLES.includes(role as SubAdminAssignableRole))
        return { error: `Rol no permitido: ${role}` }
      const { data: target } = await supabase
        .from('profiles').select('role').eq('id', userId).single()
      if (target?.role === 'admin' || target?.role === 'sub_admin')
        return { error: 'No autorizado' }
    } else {
      return { error: 'No autorizado' }
    }

    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/clientes')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

/** Update name, phone and role — admin only. Returns { error } instead of throwing. */
export async function updateUserProfile(
  userId: string,
  data: { name: string; phone: string; role: string }
): Promise<{ error?: string }> {
  try {
    await requireStrictAdmin()

    if (!ADMIN_ASSIGNABLE_ROLES.includes(data.role as AdminAssignableRole))
      return { error: `Rol no permitido: ${data.role}` }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        name: data.name.trim() || null,
        phone: data.phone.trim() || null,
        role: data.role,
      })
      .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/clientes')
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

/** Bulk update profiles from CSV — admin only. */
export async function importClientsFromCSV(
  rows: { email: string; name: string; phone: string }[]
): Promise<{ updated: number; skipped: number; error?: string }> {
  try {
    await requireStrictAdmin()
    const supabase = createAdminClient()

    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const emailToId = new Map(
      (usersData?.users ?? []).map((u) => [u.email?.toLowerCase() ?? '', u.id])
    )

    let updated = 0
    let skipped = 0

    for (const row of rows) {
      const email = row.email.trim().toLowerCase()
      if (!email) continue
      const id = emailToId.get(email)
      if (!id) { skipped++; continue }
      const { error } = await supabase
        .from('profiles')
        .update({ name: row.name.trim() || null, phone: row.phone.trim() || null })
        .eq('id', id)
      if (!error) updated++
      else skipped++
    }

    revalidatePath('/dashboard/clientes')
    return { updated, skipped }
  } catch (err) {
    return { updated: 0, skipped: rows.length, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
