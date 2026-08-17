import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function ContenidoAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('cms:read')
  return <>{children}</>
}
