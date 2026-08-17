import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function EditarProductoLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('catalog:write')
  return <>{children}</>
}
