import { db } from '@/shared/lib/db'
import { applicationSettings } from '@/domains/settings/schema'
import { asc, eq } from 'drizzle-orm'
import type { AdminSetting } from './types'

export async function listSettings(): Promise<AdminSetting[]> {
  const rows = await db
    .select({
      id: applicationSettings.id,
      key: applicationSettings.key,
      value: applicationSettings.value,
      description: applicationSettings.description,
    })
    .from(applicationSettings)
    .orderBy(asc(applicationSettings.key))

  return rows.map((r) => ({
    id: r.id,
    key: r.key,
    value: r.value,
    description: r.description ?? null,
  }))
}

export async function upsertSetting(
  key: string,
  value: string,
  userId: string,
): Promise<void> {
  await db
    .insert(applicationSettings)
    .values({ key, value, updatedBy: userId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: applicationSettings.key,
      set: { value, updatedBy: userId, updatedAt: new Date() },
    })
}
