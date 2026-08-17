import { db } from '@/shared/lib/db'
import { notificationLog } from './schema'

type LogEntry = {
  type: 'email' | 'whatsapp_link' | 'sms'
  recipient: string
  subject?: string
  templateId: string
  status: 'sent' | 'failed' | 'skipped'
  error?: string
  orderId?: string
  customerId?: string
}

export async function logNotification(entry: LogEntry): Promise<void> {
  try {
    await db.insert(notificationLog).values({
      type: entry.type,
      recipient: entry.recipient,
      subject: entry.subject ?? null,
      templateId: entry.templateId,
      status: entry.status,
      error: entry.error ?? null,
      orderId: entry.orderId ?? null,
      customerId: entry.customerId ?? null,
    })
  } catch {
    // Never crash the calling flow due to a log failure
  }
}
