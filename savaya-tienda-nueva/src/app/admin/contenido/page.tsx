import { Suspense } from 'react'
import { Skeleton } from '@/shared/ui/Skeleton'
import { getAdminSections, listAdminBanners, listAdminPopups } from '@/domains/admin/cms/repository'
import { ContenidoView } from '@/domains/admin/cms/components/ContenidoView'

export const metadata = {
  title: 'Contenido | Admin SAVAYA',
}

async function ContenidoData() {
  const [sections, banners, popups] = await Promise.all([
    getAdminSections('home'),
    listAdminBanners(),
    listAdminPopups(),
  ])

  return <ContenidoView sections={sections} banners={banners} popups={popups} />
}

function ContenidoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border pb-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="text" height={40} className="w-28" />
        ))}
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <Skeleton height={400} className="w-full lg:w-72 rounded-xl" />
        <Skeleton height={400} className="flex-1 rounded-xl" />
      </div>
    </div>
  )
}

export default function ContenidoAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl uppercase tracking-wide mb-1">Contenido</h1>
        <p className="text-sm text-text-secondary">
          Gestiona los bloques de la página home, banners y popups.
        </p>
      </div>
      <Suspense fallback={<ContenidoSkeleton />}>
        <ContenidoData />
      </Suspense>
    </div>
  )
}
