/**
 * Admin Dashboard Loading Skeleton
 */
export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-9 w-40 bg-gray-200 rounded-lg" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-28 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-4 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-28 bg-gray-50 rounded" />
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-100 rounded" />
            <div className="h-5 w-32 bg-gray-200 rounded" />
          </div>
          <div className="h-4 w-64 bg-gray-100 rounded" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-8 w-8 bg-gray-100 rounded-lg" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-48 bg-gray-100 rounded mb-1" />
                <div className="h-3 w-32 bg-gray-50 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
