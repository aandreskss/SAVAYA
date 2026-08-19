import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function MetodosPagoLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('settings:read')
  return <>{children}</>
}
