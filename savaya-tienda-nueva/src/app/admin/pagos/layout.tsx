import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function PagosAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('payments:read')
  return <>{children}</>
}
