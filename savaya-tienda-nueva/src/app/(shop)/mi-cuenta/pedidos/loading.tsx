import { Skeleton } from '@/shared/ui/Skeleton'

export default function PedidosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" height={24} className="w-32 mb-6" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" height={16} className="w-28" />
            <Skeleton height={24} className="w-24 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton variant="text" height={14} className="w-36" />
            <Skeleton variant="text" height={14} className="w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
