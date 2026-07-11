'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function verifyPayment(orderId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/pedidos/${orderId}`)
  return { ok: true }
}

export async function markShipped(
  orderId: string,
  data: {
    tracking_number?: string
    shipping_proof_url?: string
    shipping_notes?: string
  },
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'shipped', ...data })
    .eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/pedidos/${orderId}`)
  return { ok: true }
}

export async function markDelivered(orderId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'delivered' })
    .eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/pedidos/${orderId}`)
  return { ok: true }
}
