'use server'

import { requireAdmin } from '@/domains/admin/lib/require-permission'
import { getPendingPayments } from './repository'
import type { PendingPaymentItem } from './types'

export type NotificationResult = {
  items: PendingPaymentItem[]
  count: number
}

export async function getNotificationsAction(): Promise<NotificationResult> {
  await requireAdmin()
  const items = await getPendingPayments()
  return { items, count: items.length }
}
