import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getVariantDetail, getVariantInventoryHistory } from '@/domains/admin/inventory/repository'
import { VariantHistory } from '@/domains/admin/inventory/components/VariantHistory'

type Props = { params: Promise<{ variantId: string }> }

export default async function VariantInventoryPage({ params }: Props) {
  const { variantId } = await params
  const [variant, history] = await Promise.all([
    getVariantDetail(variantId),
    getVariantInventoryHistory(variantId),
  ])

  if (!variant) notFound()

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/admin/inventario"
          className="font-sans text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Volver al inventario
        </Link>
      </div>

      <VariantHistory variant={variant} history={history} />
    </div>
  )
}
