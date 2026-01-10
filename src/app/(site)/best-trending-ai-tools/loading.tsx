import { Container } from '@/components/layout/Container';

/**
 * Best Trending AI Tools Page Loading Skeleton
 * Displays during page transitions for the trending tools page
 */
export default function Loading() {
  return (
    <div className="min-h-screen py-8">
      <Container>
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="h-10 w-80 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
          <div className="h-5 w-96 max-w-full bg-gray-100 rounded mx-auto animate-pulse" />
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-5 w-3/4 bg-gray-200 rounded mb-1" />
                    <div className="h-4 w-1/2 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 w-16 bg-purple-100 rounded" />
                  <div className="h-5 w-20 bg-yellow-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center mt-8">
          <div className="h-12 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </Container>
    </div>
  );
}
