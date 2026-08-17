import { Suspense } from 'react'
import { listDiscounts } from '@/domains/discounts-promotions/repository'
import { DiscountsManager } from '@/domains/admin/discounts/components/DiscountsManager'
import { BlockSkeleton } from '@/app/admin/_components/DashboardSkeletons'

async function DiscountsData() {
  const discounts = await listDiscounts()
  return <DiscountsManager initialDiscounts={discounts} />
}

export default function PromocionesAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <div className="h-8 w-48 bg-surface animate-pulse rounded" />
            <BlockSkeleton />
          </div>
        }
      >
        <DiscountsData />
      </Suspense>
    </div>
  )
}
