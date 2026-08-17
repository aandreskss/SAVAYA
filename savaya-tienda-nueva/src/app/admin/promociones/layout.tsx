import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function PromocionesAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('promotions:read')
  return <>{children}</>
}
