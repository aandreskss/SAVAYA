import { Skeleton } from '@/shared/ui/Skeleton'

export default function MiCuentaLoading() {
  return (
    <div className="space-y-6">
      <Skeleton variant="text" height={28} className="w-40" />
      <div className="space-y-3">
        <Skeleton height={80} className="rounded-xl" />
        <Skeleton height={80} className="rounded-xl" />
        <Skeleton height={80} className="rounded-xl" />
      </div>
    </div>
  )
}
