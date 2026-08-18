export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { auth } from '@/domains/auth/auth'
import { ADMIN_NAV } from '@/domains/admin/lib/nav'
import { AdminShell } from '@/domains/admin/components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  const permissions = session.user.permissions ?? []
  const userName = session.user.name ?? session.user.email ?? 'Administrador'

  return (
    <AdminShell
      navItems={ADMIN_NAV}
      userPermissions={permissions}
      userName={userName}
    >
      {children}
    </AdminShell>
  )
}
