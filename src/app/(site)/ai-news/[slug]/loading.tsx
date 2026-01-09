import { Container } from '@/components/layout/Container';

/**
 * AI News Detail Page Loading Skeleton
 * Displays during page transitions for individual news articles
 */
export default function Loading() {
  return (
    <div className="min-h-screen py-8">
      <Container>
        {/* Breadcrumbs */}
        <div className="h-4 w-48 bg-gray-200 rounded mb-6 animate-pulse" />

        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <div className="mb-8">
            <div className="h-6 w-24 bg-purple-100 rounded mb-4 animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-10 w-3/4 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Featured Image */}
          <div className="aspect-video w-full bg-gray-200 rounded-xl mb-8 animate-pulse" />

          {/* Article Content */}
          <div className="space-y-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 bg-gray-100 rounded-full animate-pulse" />
            ))}
          </div>

          {/* Share Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="h-5 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 bg-gray-100 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
