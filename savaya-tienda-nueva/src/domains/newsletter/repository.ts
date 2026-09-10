import { eq } from 'drizzle-orm'
import { db } from '@/shared/lib/db'
import { newsletterSubscribers } from './schema'

export async function findSubscriberByEmail(
  email: string,
): Promise<{ id: string; status: string } | null> {
  const [row] = await db
    .select({ id: newsletterSubscribers.id, status: newsletterSubscribers.status })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1)
  return row ?? null
}

export async function saveSubscriber(email: string, resendContactId?: string): Promise<void> {
  await db
    .insert(newsletterSubscribers)
    .values({ email, resendContactId: resendContactId ?? null })
    .onConflictDoNothing()
}
