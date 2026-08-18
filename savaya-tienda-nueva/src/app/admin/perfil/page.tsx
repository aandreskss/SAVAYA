import { auth } from '@/domains/auth/auth'
import { requireAdmin } from '@/domains/admin/lib/require-permission'
import { db } from '@/shared/lib/db'
import { twoFactorSecrets } from '@/domains/auth/schema'
import { eq } from 'drizzle-orm'
import { ProfileManager } from '@/domains/admin/profile/ProfileManager'

export default async function PerfilAdminPage() {
  await requireAdmin()
  const session = await auth()
  const userId = session!.user!.id!

  const [tfaRecord] = await db
    .select({ id: twoFactorSecrets.id })
    .from(twoFactorSecrets)
    .where(eq(twoFactorSecrets.userId, userId))
    .limit(1)

  return (
    <div className="p-6 md:p-8">
      <ProfileManager
        user={{
          name: session!.user!.name ?? null,
          email: session!.user!.email ?? '',
        }}
        has2FA={!!tfaRecord}
      />
    </div>
  )
}
