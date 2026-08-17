import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function ConfiguracionAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('settings:read')
  return <>{children}</>
}
