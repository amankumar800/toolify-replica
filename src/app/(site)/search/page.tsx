import { Suspense } from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { globalSearch, type SearchResultType } from '@/lib/services/search.service';
import { SearchResults } from '@/components/features/search/SearchResults';
import { SearchFilters } from '@/components/features/search/SearchFilters';
import { SearchInput } from '@/components/features/search/SearchInput';

/**
 * Search Results Page
 *
 * Displays search results across tools, news, prompts, and categories.
 * Supports filtering by content type and pagination.
 */

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: SearchResultType;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q || '';

  return {
    title: query ? `Search: "${query}" - AI Tools Book` : 'Search - AI Tools Book',
    description: query
      ? `Search results for "${query}" across AI tools, news, prompts, and categories.`
      : 'Search across 10,000+ AI tools, news articles, prompts, and categories.',
    robots: query && query.length >= 3 ? 'index, follow' : 'noindex, follow',
  };
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-[var(--border)] p-4 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function SearchResultsContent({
  query,
  type,
  page,
}: {
  query: string;
  type?: SearchResultType;
  page: number;
}) {
  if (!query || query.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] p-8 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Start your search
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Enter at least 2 characters to search across AI tools, news, prompts, and categories.
        </p>
      </div>
    );
  }

  const limit = 20;
  const offset = (page - 1) * limit;

  const searchResponse = await globalSearch({
    query,
    types: type ? [type] : undefined,
    limit,
    offset,
  });

  if (searchResponse.results.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] p-8 text-center">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No results found for &quot;{query}&quot;
        </h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Try different keywords or browse our categories to find what you&apos;re looking for.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['AI chatbot', 'image generator', 'writing tools', 'code assistant'].map((suggestion) => (
            <a
              key={suggestion}
              href={`/search?q=${encodeURIComponent(suggestion)}`}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            >
              {suggestion}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <SearchResults
      results={searchResponse.results}
      counts={searchResponse.counts}
      query={query}
      currentType={type}
      currentPage={page}
      hasMore={searchResponse.hasMore}
    />
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type as SearchResultType | undefined;
  const page = parseInt(params.page || '1', 10);

  return (
    <div className="min-h-screen py-8">
      <Container>
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {query ? (
              <>
                Search results for &quot;<span className="text-[var(--primary)]">{query}</span>&quot;
              </>
            ) : (
              'Search AI Tools Book'
            )}
          </h1>

          {/* Search Input */}
          <SearchInput initialQuery={query} className="max-w-2xl" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl animate-pulse" />}>
              <SearchFilters query={query} currentType={type} />
            </Suspense>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<SearchResultsSkeleton />}>
              <SearchResultsContent query={query} type={type} page={page} />
            </Suspense>
          </div>
        </div>
      </Container>
    </div>
  );
}
