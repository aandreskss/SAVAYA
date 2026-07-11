import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import DiscountTable from '@/components/dashboard/descuentos/DiscountTable'
import type { DiscountCode } from '@/lib/types'

export const metadata: Metadata = { title: 'Códigos de descuento — Admin' }

export default async function DescuentosPage() {
  const supabase = await createAdminClient()

  const { data } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false })

  const codes = (data ?? []) as unknown as DiscountCode[]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold text-black">Códigos de descuento</h1>
          <p className="text-sm text-gray-text font-body mt-0.5">
            {codes.length} {codes.length === 1 ? 'código' : 'códigos'} en total
          </p>
        </div>
        <Link
          href="/dashboard/descuentos/nuevo"
          className="flex items-center gap-2 bg-black text-white font-heading font-semibold text-sm px-5 py-2.5 rounded hover:bg-accent transition-colors"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nuevo código
        </Link>
      </div>

      <DiscountTable codes={codes} />
    </div>
  )
}
