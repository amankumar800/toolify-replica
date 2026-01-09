import { Container } from '@/components/layout/Container';

/**
 * Site-wide Loading Skeleton
 * Displays during page transitions for the main site routes
 */
export default function Loading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section Skeleton */}
      <div className="relative pt-16 pb-8 md:pt-24 md:pb-12">
        <Container className="flex flex-col items-center text-center">
          <div className="h-12 w-3/4 max-w-2xl bg-gray-200 rounded-lg mb-4 animate-pulse" />
          <div className="h-6 w-48 bg-gray-100 rounded mb-6 animate-pulse" />
          <div className="h-14 w-full max-w-2xl bg-gray-100 rounded-full mb-8 animate-pulse" />
        </Container>
      </div>

      <Container>
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Main Content Skeleton */}
          <main className="flex-1 min-w-0">
            {/* My Tools Section */}
            <div className="mb-8">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-20 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
                ))}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="h-10 w-96 bg-gray-100 rounded-full mb-6 animate-pulse" />

            {/* Tool Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-72 bg-white rounded-xl border border-gray-100 animate-pulse">
                  <div className="h-36 bg-gray-100 rounded-t-xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 bg-gray-100 rounded" />
                    <div className="h-4 w-full bg-gray-50 rounded" />
                    <div className="h-4 w-2/3 bg-gray-50 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Category Grid */}
            <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </main>

          {/* Sidebar Skeleton */}
          <aside className="hidden xl:block w-[360px] shrink-0">
            <div className="h-6 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
