export default function Loading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Navbar skeleton */}
      <div className="h-16 border-b border-gray-100 bg-white flex items-center px-8">
        <div className="h-5 w-32 bg-gray-100 rounded" />
        <div className="flex-1" />
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-gray-100 rounded" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="h-[60vh] md:h-[500px] bg-gray-100" />

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="h-6 w-48 bg-gray-100 rounded mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[3/4] bg-gray-100 rounded" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
