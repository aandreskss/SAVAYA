import { db } from '@/shared/lib/db'
import { desc, eq } from 'drizzle-orm'
import { auditLog } from './schema'

export type AuditLogRow = {
  id: string
  actorEmail: string | null
  action: string
  resourceType: string
  resourceId: string | null
  after: unknown
  ip: string | null
  createdAt: Date
}

export async function listAuditLogEntries(opts: {
  action?: string
  limit?: number
}): Promise<AuditLogRow[]> {
  const { action, limit = 200 } = opts

  const base = db
    .select({
      id: auditLog.id,
      actorEmail: auditLog.actorEmail,
      action: auditLog.action,
      resourceType: auditLog.resourceType,
      resourceId: auditLog.resourceId,
      after: auditLog.after,
      ip: auditLog.ip,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)

  const rows = action ? await base.where(eq(auditLog.action, action)) : await base
  return rows.map((r) => ({ ...r, resourceId: r.resourceId ?? null }))
}

export async function listDistinctAuditActions(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ action: auditLog.action })
    .from(auditLog)
    .orderBy(auditLog.action)
  return rows.map((r) => r.action)
}
