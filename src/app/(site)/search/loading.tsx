import { Container } from '@/components/layout/Container';

/**
 * Search Page Loading Skeleton
 * Displays during page transitions for search results
 */
export default function Loading() {
  return (
    <div className="min-h-screen py-8">
      <Container>
        {/* Search Header */}
        <div className="mb-8">
          <div className="h-9 w-80 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="h-12 w-full max-w-2xl bg-gray-100 rounded-lg animate-pulse" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="h-5 w-20 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results count */}
            <div className="h-5 w-40 bg-gray-100 rounded mb-4 animate-pulse" />

            {/* Results list */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-full" />
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                      <div className="flex gap-2 pt-2">
                        <div className="h-6 w-16 bg-gray-100 rounded-full" />
                        <div className="h-6 w-20 bg-gray-100 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
