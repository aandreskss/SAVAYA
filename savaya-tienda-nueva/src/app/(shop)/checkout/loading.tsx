import { Skeleton } from '@/shared/ui/Skeleton'

export default function CheckoutLoading() {
  return (
    <div className="min-h-[70vh] max-w-screen-lg mx-auto px-4 py-12">
      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="circle" width={32} height={32} />
            <Skeleton variant="text" height={14} className="w-16 hidden sm:block" />
            {i < 3 && <Skeleton height={2} className="w-8 hidden sm:block" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Main form area */}
        <div className="space-y-4">
          <Skeleton variant="text" height={24} className="w-40 mb-6" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton variant="text" height={12} className="w-24" />
              <Skeleton height={42} className="w-full rounded-md" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton variant="text" height={12} className="w-20" />
                <Skeleton height={42} className="w-full rounded-md" />
              </div>
            ))}
          </div>
          <Skeleton height={48} className="w-full rounded-full mt-6" />
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          <Skeleton variant="text" height={20} className="w-32 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-16 h-16 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" height={14} className="w-3/4" />
                <Skeleton variant="text" height={12} className="w-1/2" />
              </div>
              <Skeleton variant="text" height={14} className="w-14" />
            </div>
          ))}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between">
              <Skeleton variant="text" height={14} className="w-20" />
              <Skeleton variant="text" height={14} className="w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton variant="text" height={16} className="w-16" />
              <Skeleton variant="text" height={16} className="w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
