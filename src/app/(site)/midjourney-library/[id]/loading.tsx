import { Container } from '@/components/layout/Container';

/**
 * Midjourney Library Detail Page Loading Skeleton
 * Displays during page transitions for individual prompt details
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0b0f19] py-8">
      <Container>
        {/* Breadcrumbs */}
        <div className="h-4 w-48 bg-gray-800 rounded mb-6 animate-pulse" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square w-full bg-gray-800 rounded-xl animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-20 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title */}
            <div className="h-8 w-3/4 bg-gray-800 rounded animate-pulse" />

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-20 bg-gray-800 rounded-full animate-pulse" />
              ))}
            </div>

            {/* SREF Code */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="h-5 w-24 bg-gray-800 rounded mb-2 animate-pulse" />
              <div className="h-10 w-full bg-gray-800 rounded animate-pulse" />
            </div>

            {/* Prompt */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="h-5 w-16 bg-gray-800 rounded mb-2 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-800 rounded animate-pulse" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <div className="h-12 flex-1 bg-purple-900/50 rounded-lg animate-pulse" />
              <div className="h-12 w-12 bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-12 w-12 bg-gray-800 rounded-lg animate-pulse" />
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-6 w-12 bg-gray-800 rounded mx-auto mb-1 animate-pulse" />
                  <div className="h-4 w-16 bg-gray-800 rounded mx-auto animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Section */}
        <div className="mt-12">
          <div className="h-7 w-40 bg-gray-800 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
