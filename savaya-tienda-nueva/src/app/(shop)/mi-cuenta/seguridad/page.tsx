import type { Metadata } from 'next'
import { auth } from '@/domains/auth/auth'
import { db } from '@/shared/lib/db'
import { sessions } from '@/domains/auth/schema'
import { eq } from 'drizzle-orm'
import { SeguridadView } from '@/domains/customers/components/SeguridadView'

export const metadata: Metadata = {
  title: 'Seguridad | SAVAYA',
  robots: { index: false, follow: false },
}

export default async function SeguridadPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const activeSessions = process.env.DATABASE_URL
    ? await db
        .select({
          id: sessions.id,
          expires: sessions.expires,
        })
        .from(sessions)
        .where(eq(sessions.userId, session.user.id))
    : []

  return <SeguridadView activeSessions={activeSessions} />
}
