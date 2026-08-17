import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function CategoriasLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('catalog:read')
  return <>{children}</>
}
