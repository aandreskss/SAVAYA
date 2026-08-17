import { requireAdminPermission } from '@/domains/admin/lib/require-permission'

export default async function AnalyticsAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPermission('analytics:read')
  return <>{children}</>
}
