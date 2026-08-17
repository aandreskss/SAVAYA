import { redirect } from 'next/navigation'
import { auth } from '@/domains/auth/auth'
import type { PermissionSlug } from '@/domains/roles-permissions/permissions'

/**
 * Server-side RBAC guard. Call at the top of admin layouts/pages.
 * Redirects to /admin/login if no session; to /admin?forbidden=1 if missing permission.
 */
export async function requireAdminPermission(permission: PermissionSlug): Promise<void> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/admin/login')
  }

  const permissions = session.user.permissions ?? []
  if (!permissions.includes(permission)) {
    redirect('/admin?forbidden=1')
  }
}

/**
 * Verifies the user is logged in as admin (any role).
 * Does not check a specific permission.
 */
export async function requireAdmin(): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/admin/login')
  }
}
