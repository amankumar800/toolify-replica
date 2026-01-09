'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Layers, Newspaper, Sparkles, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResultType } from '@/lib/services/search.service';

interface SearchFiltersProps {
  query: string;
  currentType?: SearchResultType;
}

const FILTER_OPTIONS: { type: SearchResultType | 'all'; label: string; icon: React.ElementType }[] = [
  { type: 'all', label: 'All Results', icon: Layers },
  { type: 'tool', label: 'AI Tools', icon: Sparkles },
  { type: 'news', label: 'News', icon: Newspaper },
  { type: 'category', label: 'Categories', icon: FolderOpen },
  { type: 'prompt', label: 'Prompts', icon: Sparkles },
];

export function SearchFilters({ query, currentType }: SearchFiltersProps) {
  const pathname = usePathname();

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-4 sticky top-[calc(var(--header-height,64px)+1rem)]">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Filter by Type
      </h2>
      <nav className="space-y-1">
        {FILTER_OPTIONS.map(({ type, label, icon: Icon }) => {
          const isActive = type === 'all' ? !currentType : currentType === type;
          const href =
            type === 'all'
              ? `/search?q=${encodeURIComponent(query)}`
              : `/search?q=${encodeURIComponent(query)}&type=${type}`;

          return (
            <Link
              key={type}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Quick Links */}
      <div className="mt-6 pt-4 border-t border-[var(--border)]">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Browse
        </h3>
        <div className="space-y-1">
          <Link
            href="/category"
            className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
          >
            All Categories
          </Link>
          <Link
            href="/free-ai-tools"
            className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
          >
            Free AI Tools
          </Link>
          <Link
            href="/best-trending-ai-tools"
            className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
          >
            Trending Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
