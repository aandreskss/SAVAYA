'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function submitPaymentProof(
  orderId: string,
  data: {
    payment_proof_url: string | null
    payment_transaction_id: string | null
    payment_date: string | null
    payment_account_holder: string | null
  },
) {
  const supabase = createAdminClient()

  // Verify order exists, fetch email for ownership check
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, email')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) throw new Error('Pedido no encontrado')
  if (order.status === 'cancelled') throw new Error('El pedido está cancelado')
  if (order.status === 'paid') throw new Error('Este pedido ya fue verificado')

  // If the caller is authenticated, verify they own the order (admins bypass this check)
  try {
    const userClient = await createClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (user) {
      const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).single()
      const isAdmin = profile?.role === 'admin'
      if (!isAdmin && user.email?.toLowerCase() !== (order.email as string)?.toLowerCase()) {
        throw new Error('No autorizado')
      }
    }
    // Guest (no user) — allow: UUID is 128-bit random and unguessable
  } catch (err) {
    if (err instanceof Error && err.message === 'No autorizado') throw err
    // Auth service unavailable — allow to not break guest flow
  }

  const { error } = await supabase
    .from('orders')
    .update(data)
    .eq('id', orderId)

  if (error) throw new Error(error.message)
}
