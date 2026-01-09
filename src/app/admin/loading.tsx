/**
 * Admin Section Loading Skeleton
 * Displays during page transitions for all admin routes
 */
export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 w-32 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-blue-200 rounded-lg animate-pulse" />
      </div>

      {/* Stats Cards (for dashboard) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-4 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Data Table Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-64 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
              <div className="h-5 w-5 bg-gray-100 rounded" />
              <div className="flex-1 flex items-center gap-4">
                <div className="h-5 w-48 bg-gray-200 rounded" />
                <div className="h-5 w-32 bg-gray-100 rounded hidden md:block" />
                <div className="h-6 w-20 bg-green-100 rounded hidden md:block" />
                <div className="h-5 w-24 bg-gray-100 rounded hidden lg:block" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-100 rounded" />
                <div className="h-8 w-8 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
