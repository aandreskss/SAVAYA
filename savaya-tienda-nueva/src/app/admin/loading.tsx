import { Skeleton } from '@/shared/ui/Skeleton'

export default function AdminLoading() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Skeleton variant="text" height={32} className="w-40 mb-2" />
        <Skeleton variant="text" height={14} className="w-56" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <Skeleton variant="text" height={12} className="w-24" />
            <Skeleton variant="text" height={32} className="w-20" />
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-xl p-5">
        <Skeleton variant="text" height={20} className="w-32 mb-4" />
        <Skeleton height={180} className="w-full rounded-lg" />
      </div>
    </div>
  )
}
