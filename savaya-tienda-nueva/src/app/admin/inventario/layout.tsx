import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function InventarioAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('inventory:read')
  return <>{children}</>
}
