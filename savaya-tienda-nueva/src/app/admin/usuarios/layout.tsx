import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function UsuariosAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('users:read')
  return <>{children}</>
}
