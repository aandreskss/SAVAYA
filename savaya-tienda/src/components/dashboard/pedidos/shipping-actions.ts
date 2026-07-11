'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

export async function updateOrderContact(
  orderId: string,
  data: {
    email: string
    name: string
    phone: string
    address_line: string
    city: string
    department: string
    postal_code: string
  },
) {
  const { email, ...addr } = data

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({
      email: email.trim(),
      shipping_address: {
        name: addr.name.trim(),
        phone: addr.phone.trim() || null,
        address_line: addr.address_line.trim(),
        city: addr.city.trim(),
        department: addr.department.trim() || null,
        postal_code: addr.postal_code.trim() || null,
      },
    })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/pedidos/${orderId}`)
  return { ok: true }
}
