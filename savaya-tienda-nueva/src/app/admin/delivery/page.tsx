import { Suspense } from 'react'
import { listAdminZones } from '@/domains/shipping/repository'
import { DeliveryManager } from '@/domains/admin/shipping/components/DeliveryManager'

async function DeliveryContent() {
  const zones = await listAdminZones()
  return <DeliveryManager initialZones={zones} />
}

export default function DeliveryAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-text-secondary text-sm">
            Cargando zonas…
          </div>
        }
      >
        <DeliveryContent />
      </Suspense>
    </div>
  )
}
