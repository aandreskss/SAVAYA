import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function DeliveryAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('shipping:read')
  return <>{children}</>
}
