import { db } from '@/shared/lib/db'
import { applicationSettings } from '@/domains/settings/schema'
import { asc, eq, inArray } from 'drizzle-orm'
import type { AdminSetting, SizeGuideConfig, SizeGuideRow } from './types'

export const DEFAULT_SIZE_GUIDE_ROWS: SizeGuideRow[] = [
  { ve: '35', eu: '35', cm: '22.5' },
  { ve: '36', eu: '36', cm: '23.0' },
  { ve: '37', eu: '37', cm: '23.5' },
  { ve: '38', eu: '38', cm: '24.0' },
  { ve: '39', eu: '39', cm: '24.5' },
  { ve: '40', eu: '40', cm: '25.0' },
  { ve: '41', eu: '41', cm: '25.5' },
]

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

export async function getSettingValue(key: string): Promise<string | null> {
  const [row] = await db
    .select({ value: applicationSettings.value })
    .from(applicationSettings)
    .where(eq(applicationSettings.key, key))
    .limit(1)
  return row?.value ?? null
}

export async function getSizeGuideConfig(): Promise<SizeGuideConfig> {
  const results = await db
    .select({ key: applicationSettings.key, value: applicationSettings.value })
    .from(applicationSettings)
    .where(inArray(applicationSettings.key, ['size_guide_enabled', 'size_guide_rows']))

  const map = new Map(results.map((r) => [r.key, r.value]))

  const enabledVal = map.get('size_guide_enabled')
  const enabled = enabledVal !== undefined ? enabledVal !== 'false' : true

  let guideRows: SizeGuideRow[] = DEFAULT_SIZE_GUIDE_ROWS
  const rowsVal = map.get('size_guide_rows')
  if (rowsVal) {
    try {
      const parsed = JSON.parse(rowsVal) as unknown
      if (Array.isArray(parsed) && parsed.length > 0) {
        guideRows = parsed as SizeGuideRow[]
      }
    } catch {
      // Keep defaults on parse failure
    }
  }

  return { enabled, rows: guideRows }
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
