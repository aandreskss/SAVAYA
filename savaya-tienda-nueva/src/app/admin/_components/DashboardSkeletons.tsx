import { Skeleton } from '@/shared/ui/Skeleton'

export function KPIsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-2">
          <Skeleton variant="text" height={12} className="w-24" />
          <Skeleton variant="text" height={28} className="w-20" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-6">
      <Skeleton variant="text" height={18} className="w-40 mb-4" />
      <Skeleton height={180} className="w-full rounded-lg" />
    </div>
  )
}

export function BlockSkeleton({ title: _ }: { title?: string } = {}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <Skeleton variant="text" height={18} className="w-40 mb-2" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
          <div className="space-y-1">
            <Skeleton variant="text" height={14} className="w-36" />
            <Skeleton variant="text" height={12} className="w-24" />
          </div>
          <Skeleton variant="text" height={14} className="w-16" />
        </div>
      ))}
    </div>
  )
}
