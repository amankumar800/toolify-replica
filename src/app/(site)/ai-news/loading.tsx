/**
 * AI News Page Loading Skeleton
 * Displays during page transitions for the news listing
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs Skeleton */}
      <div className="h-4 w-32 bg-gray-200 rounded mb-6 animate-pulse" />

      {/* Header Section */}
      <div className="mb-6">
        <div className="h-10 w-64 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="h-16 w-full max-w-xl bg-gray-100 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8">
          {/* Filters Skeleton */}
          <div className="h-14 bg-gray-100 rounded-lg mb-6 animate-pulse" />

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                  <div className="h-6 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-4 w-24 bg-gray-100 rounded" />
                    <div className="h-4 w-16 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Trending Section */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-6 w-6 bg-gray-100 rounded" />
                  <div className="flex-1 h-5 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter Skeleton */}
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
