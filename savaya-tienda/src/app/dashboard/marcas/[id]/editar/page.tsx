import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import BrandForm from '@/components/dashboard/marcas/BrandForm'
import type { Brand } from '@/lib/types'

export const metadata: Metadata = { title: 'Editar marca — Admin' }

export default async function EditarMarcaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data } = await supabase.from('brands').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div>
      <BrandForm brand={data as Brand} />
    </div>
  )
}
