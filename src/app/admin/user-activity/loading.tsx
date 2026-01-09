/**
 * Admin User Activity Page Loading Skeleton
 */
export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-44 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-100 rounded-lg" />
          <div className="h-10 w-28 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="h-10 w-40 bg-gray-100 rounded-lg" />
        <div className="h-10 w-40 bg-gray-100 rounded-lg" />
        <div className="h-10 w-40 bg-gray-100 rounded-lg" />
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="h-8 w-8 bg-gray-100 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-64 bg-gray-100 rounded mb-1" />
                <div className="h-3 w-40 bg-gray-50 rounded" />
              </div>
              <div className="h-5 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-32 bg-gray-50 rounded" />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="h-4 w-40 bg-gray-100 rounded" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
