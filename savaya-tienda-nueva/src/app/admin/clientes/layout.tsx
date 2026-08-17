import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function ClientesAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('customers:read')
  return <>{children}</>
}
