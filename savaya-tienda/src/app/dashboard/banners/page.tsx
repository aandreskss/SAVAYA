import { createAdminClient } from '@/lib/supabase/server'
import BannersEditor from '@/components/dashboard/banners/BannersEditor'
import type { BannerConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function BannersPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('banner_config')
    .select('*')
    .order('id')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-black">Banners</h1>
        <p className="text-gray-text text-sm mt-1">
          Editor de banners promocionales del homepage y el mega menú
        </p>
      </div>

      <BannersEditor banners={(data ?? []) as BannerConfig[]} />
    </div>
  )
}
