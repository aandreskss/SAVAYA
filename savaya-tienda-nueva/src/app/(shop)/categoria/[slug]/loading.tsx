import { Skeleton } from '@/shared/ui/Skeleton'

export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <Skeleton variant="text" width={200} height={14} className="mb-8" />

      {/* Header */}
      <div className="mb-8">
        <Skeleton variant="text" height={36} className="w-48 mb-2" />
        <Skeleton variant="text" height={14} className="w-32" />
      </div>

      <div className="flex gap-8">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:block w-56 shrink-0 space-y-3">
          <Skeleton height={20} className="w-20 mb-4" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton variant="circle" width={16} height={16} />
              <Skeleton variant="text" height={14} className={i % 2 === 0 ? 'w-24' : 'w-16'} />
            </div>
          ))}
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-end mb-6">
            <Skeleton height={36} className="w-36 rounded-md" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton variant="text" height={16} className="w-3/4" />
                <Skeleton variant="text" height={14} className="w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
