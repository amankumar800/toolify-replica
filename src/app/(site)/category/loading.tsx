import { Container } from '@/components/layout/Container';
import { CategoryCardSkeleton } from '@/components/features/category/CategoryCardSkeleton';

/**
 * Loading component for the category page.
 * Displays skeleton placeholders while data is being fetched.
 *
 * Requirements: 7.1 - Display skeleton placeholder components during loading
 */
export default function Loading() {
  // Display 12 skeleton cards to match expected category count
  const skeletonCount = 12;

  return (
    <main className="min-h-screen bg-toolify-bg">
      {/* Hero section skeleton */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 py-16">
        <Container>
          <div className="text-center">
            {/* Title skeleton */}
            <div className="h-10 w-80 bg-white/20 rounded-lg mx-auto mb-4 animate-pulse" />
            {/* Subtitle skeleton */}
            <div className="h-6 w-64 bg-white/20 rounded-lg mx-auto mb-8 animate-pulse" />
            {/* Search input skeleton */}
            <div className="max-w-md mx-auto">
              <div className="h-12 bg-white/20 rounded-lg animate-pulse" />
            </div>
          </div>
        </Container>
      </div>

      {/* Category grid skeleton */}
      <Container className="py-12">
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          role="status"
          aria-label="Loading categories"
        >
          {Array.from({ length: skeletonCount }, (_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
        <span className="sr-only">Loading categories...</span>
      </Container>
    </main>
  );
}
