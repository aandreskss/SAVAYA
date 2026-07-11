import { createAdminClient } from '@/lib/supabase/server'
import ConfigForm from '@/components/dashboard/configuracion/ConfigForm'
import type { StoreSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 'main')
    .single()

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-black">Configuración</h1>
        <p className="text-gray-text text-sm mt-1">Ajustes generales de la tienda</p>
      </div>

      <ConfigForm initialSettings={data as StoreSettings | null} />
    </div>
  )
}
