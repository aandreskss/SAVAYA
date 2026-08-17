import { Suspense } from 'react'
import { auth } from '@/domains/auth/auth'
import { listAdminUsers, listRoles } from '@/domains/admin/users/repository'
import { UsersManager } from '@/domains/admin/users/components/UsersManager'

async function UsuariosContent() {
  const [users, roles, session] = await Promise.all([
    listAdminUsers(),
    listRoles(),
    auth(),
  ])

  const currentUserId = session?.user?.id ?? ''
  const permissions = (session?.user?.permissions ?? []) as string[]
  const isSuperAdmin = permissions.includes('exchange_rates:override')

  return (
    <UsersManager
      initialUsers={users}
      allRoles={roles}
      currentUserId={currentUserId}
      isSuperAdmin={isSuperAdmin}
    />
  )
}

export default function UsuariosAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-text-secondary text-sm">
            Cargando usuarios…
          </div>
        }
      >
        <UsuariosContent />
      </Suspense>
    </div>
  )
}
