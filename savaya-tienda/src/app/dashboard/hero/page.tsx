import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import HeroSlidesEditor from '@/components/dashboard/hero/HeroSlidesEditor'

export const metadata: Metadata = { title: 'Hero Carrousel — Admin' }

export default async function HeroPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('hero_slides')
    .select('*')
    .order('sort_order', { ascending: true })

  const slides = (data ?? []).map(s => ({
    id: s.id as string,
    sort_order: s.sort_order as number,
    eyebrow: (s.eyebrow as string) ?? '',
    title: (s.title as string) ?? '',
    description: (s.description as string) ?? '',
    cta: (s.cta as string) ?? '',
    href: (s.href as string) ?? '',
    cta2: (s.cta2 as string) ?? '',
    href2: (s.href2 as string) ?? '',
    image_url: (s.image_url as string) ?? '',
    mobile_image_url: (s.mobile_image_url as string) ?? '',
    image_href: (s.image_href as string) ?? '',
    accent: (s.accent as string) ?? 'gold',
    is_active: (s.is_active as boolean) ?? true,
  }))

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold text-black">Hero Carrousel</h1>
        <p className="text-sm text-gray-text mt-1 font-body">
          Edita los slides del banner principal de la homepage. Los cambios se aplican de inmediato.
        </p>
      </div>

      <HeroSlidesEditor initialSlides={slides} />
    </div>
  )
}
