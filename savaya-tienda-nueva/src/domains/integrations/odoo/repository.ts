import { db } from '@/shared/lib/db'
import { desc } from 'drizzle-orm'
import { odooSyncLogs, type OdooSyncLogInsert, type OdooSyncLog } from './schema'

export async function saveOdooSyncLog(data: OdooSyncLogInsert): Promise<void> {
  await db.insert(odooSyncLogs).values(data)
}

export async function listRecentSyncLogs(limit = 10): Promise<OdooSyncLog[]> {
  return db
    .select()
    .from(odooSyncLogs)
    .orderBy(desc(odooSyncLogs.startedAt))
    .limit(limit)
}
