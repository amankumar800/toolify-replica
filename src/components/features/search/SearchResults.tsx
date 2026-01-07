import Link from 'next/link';
import Image from 'next/image';
import { Wrench, Newspaper, Sparkles, FolderOpen, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult, SearchResultType } from '@/lib/services/search.service';

interface SearchResultsProps {
  results: SearchResult[];
  counts: {
    tools: number;
    news: number;
    prompts: number;
    categories: number;
    total: number;
  };
  query: string;
  currentType?: SearchResultType;
  currentPage: number;
  hasMore: boolean;
}

const TYPE_CONFIG: Record<
  SearchResultType,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  tool: {
    label: 'AI Tool',
    icon: Wrench,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  news: {
    label: 'News',
    icon: Newspaper,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  prompt: {
    label: 'Prompt',
    icon: Sparkles,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  category: {
    label: 'Category',
    icon: FolderOpen,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
};

function ResultCard({ result }: { result: SearchResult }) {
  const config = TYPE_CONFIG[result.type];
  const Icon = config.icon;

  // Get image based on result type
  const imageUrl =
    result.type === 'tool'
      ? result.image
      : result.type === 'news'
      ? result.image
      : result.type === 'prompt'
      ? result.image
      : null;

  // Get additional info based on type
  const getSubInfo = () => {
    switch (result.type) {
      case 'tool':
        return (
          <div className="flex items-center gap-2 text-sm">
            {result.pricing && (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                {result.pricing}
              </span>
            )}
            {result.categories.length > 0 && (
              <span className="text-gray-500">{result.categories.slice(0, 2).join(', ')}</span>
            )}
          </div>
        );
      case 'news':
        return (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {result.category && <span>{result.category}</span>}
            {result.publishedAt && (
              <>
                <span>•</span>
                <span>{new Date(result.publishedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        );
      case 'prompt':
        return (
          <div className="flex items-center gap-2 text-sm">
            {result.promptType && (
              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-medium">
                {result.promptType}
              </span>
            )}
            {result.tags && result.tags.length > 0 && (
              <span className="text-gray-500">{result.tags.slice(0, 3).join(', ')}</span>
            )}
          </div>
        );
      case 'category':
        return (
          <div className="text-sm text-gray-500">
            {result.toolCount} tools
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Link
      href={result.url}
      className="block bg-white rounded-xl border border-[var(--border)] p-4 hover:border-[var(--primary)] hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Image/Icon */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={imageUrl}
                alt={result.title}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : (
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', config.bgColor)}>
              <Icon className={cn('w-6 h-6', config.color)} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                config.bgColor,
                config.color
              )}
            >
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-[var(--primary)] transition-colors line-clamp-1">
            {result.title}
          </h3>
          {result.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{result.description}</p>
          )}
          <div className="mt-2">{getSubInfo()}</div>
        </div>

        {/* Arrow */}
        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[var(--primary)] transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}

export function SearchResults({
  results,
  counts,
  query,
  currentType,
  currentPage,
  hasMore,
}: SearchResultsProps) {
  const limit = 20;
  const totalPages = Math.ceil(counts.total / limit);

  // Build pagination URLs
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set('q', query);
    if (currentType) params.set('type', currentType);
    if (page > 1) params.set('page', page.toString());
    return `/search?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Found <strong className="text-gray-900">{counts.total}</strong> results
          {currentType && (
            <>
              {' '}
              in <strong className="text-gray-900">{TYPE_CONFIG[currentType].label}</strong>
            </>
          )}
        </span>
        {!currentType && counts.total > 0 && (
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span>Tools: {counts.tools}</span>
            <span>News: {counts.news}</span>
            <span>Categories: {counts.categories}</span>
            <span>Prompts: {counts.prompts}</span>
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((result) => (
          <ResultCard key={`${result.type}-${result.id}`} result={result} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {currentPage > 1 && (
            <Link
              href={buildPageUrl(currentPage - 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Link>
          )}

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Link
                  key={pageNum}
                  href={buildPageUrl(pageNum)}
                  className={cn(
                    'w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors',
                    pageNum === currentPage
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <Link
              href={buildPageUrl(currentPage + 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
