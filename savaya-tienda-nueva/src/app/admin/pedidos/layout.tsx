import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function PedidosAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('orders:read')
  return <>{children}</>
}
