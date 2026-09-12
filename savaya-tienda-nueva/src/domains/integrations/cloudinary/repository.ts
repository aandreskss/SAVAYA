import { db } from '@/shared/lib/db'
import { desc } from 'drizzle-orm'
import { cloudinaryNotifications } from './schema'

export type CloudinaryNotificationRow = {
  id: string
  notificationType: string
  publicIds: string[]
  resourceType: string
  payload: unknown
  receivedAt: Date
}

export async function saveCloudinaryNotification(data: {
  notificationType: string
  publicIds: string[]
  resourceType: string
  payload: Record<string, unknown>
}): Promise<void> {
  await db.insert(cloudinaryNotifications).values(data)
}

export async function listCloudinaryNotifications(limit = 200): Promise<CloudinaryNotificationRow[]> {
  const rows = await db
    .select()
    .from(cloudinaryNotifications)
    .orderBy(desc(cloudinaryNotifications.receivedAt))
    .limit(limit)

  return rows.map((r) => ({
    id: r.id,
    notificationType: r.notificationType,
    publicIds: r.publicIds ?? [],
    resourceType: r.resourceType,
    payload: r.payload,
    receivedAt: r.receivedAt,
  }))
}

export async function countCloudinaryNotifications(): Promise<number> {
  const rows = await db
    .select({ id: cloudinaryNotifications.id })
    .from(cloudinaryNotifications)
    .limit(1000)
  return rows.length
}
