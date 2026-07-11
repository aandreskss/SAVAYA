import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types'
import DashboardShell from '@/components/dashboard/DashboardShell'

export const metadata: Metadata = {
  title: 'Admin — Savaya',
  robots: { index: false, follow: false },
}

const ALLOWED_ROLES: UserRole[] = ['admin', 'sub_admin', 'editor', 'gestor_pedidos']

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role as UserRole)) redirect('/acceso-denegado')

  const adminName = profile?.name || user.email?.split('@')[0] || 'Admin'

  return (
    <DashboardShell role={profile.role as UserRole} adminName={adminName}>
      {children}
    </DashboardShell>
  )
}
