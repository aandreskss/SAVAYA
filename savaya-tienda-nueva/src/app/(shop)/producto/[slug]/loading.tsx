import { Skeleton } from '@/shared/ui/Skeleton'

export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <Skeleton variant="text" width={240} height={14} className="mb-8" />

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-16 h-16 rounded-md" />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-5 pt-2">
          <Skeleton variant="text" height={32} className="w-3/4" />
          <Skeleton variant="text" height={28} className="w-1/4" />

          {/* Color selector */}
          <div className="space-y-2 pt-2">
            <Skeleton variant="text" height={12} className="w-20" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="circle" width={32} height={32} />
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div className="space-y-2">
            <Skeleton variant="text" height={12} className="w-16" />
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="w-12 h-10 rounded-md" />
              ))}
            </div>
          </div>

          {/* CTA */}
          <Skeleton height={48} className="w-full rounded-full mt-4" />
          <Skeleton height={40} className="w-full rounded-full" />

          {/* Description */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Skeleton variant="text" height={14} className="w-full" />
            <Skeleton variant="text" height={14} className="w-5/6" />
            <Skeleton variant="text" height={14} className="w-4/6" />
          </div>
        </div>
      </div>
    </div>
  )
}
