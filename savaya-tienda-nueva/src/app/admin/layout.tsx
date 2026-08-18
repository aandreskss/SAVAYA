export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/domains/auth/auth'
import { ADMIN_NAV } from '@/domains/admin/lib/nav'
import { AdminShell } from '@/domains/admin/components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const pathname = h.get('x-pathname') ?? ''

  // Login page must not be protected — it would cause an infinite redirect loop
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

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
