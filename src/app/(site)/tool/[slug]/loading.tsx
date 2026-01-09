import { Container } from '@/components/layout/Container';

/**
 * Tool Detail Page Loading Skeleton
 * Displays during page transitions for individual tool pages
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Area */}
      <div className="bg-white border-b border-gray-200 py-8">
        <Container>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Icon Skeleton */}
            <div className="w-24 h-24 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />

            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-10 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-10 w-28 bg-gray-100 rounded animate-pulse" />
                  <div className="h-10 w-36 bg-purple-200 rounded animate-pulse" />
                </div>
              </div>

              <div className="h-6 w-3/4 bg-gray-100 rounded mb-4 animate-pulse" />

              <div className="flex flex-wrap items-center gap-4">
                <div className="h-5 w-24 bg-yellow-100 rounded animate-pulse" />
                <div className="h-5 w-20 bg-purple-100 rounded animate-pulse" />
                <div className="h-5 w-28 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="h-7 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                ))}
                <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="h-7 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex justify-between mb-2">
                      <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-yellow-100 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-full bg-gray-50 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-6 w-20 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-100">
                  <div className="h-4 w-12 bg-gray-100 rounded mb-2 animate-pulse" />
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="h-48 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </Container>
    </div>
  );
}
