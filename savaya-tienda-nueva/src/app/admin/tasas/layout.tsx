import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function TasasAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('exchange_rates:read')
  return <>{children}</>
}
