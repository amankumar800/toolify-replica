'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Wrench, Newspaper, Sparkles, Folder, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('GlobalSearch');

// ============================================
// Types
// ============================================

export type SearchResultType = 'tool' | 'news' | 'prompt' | 'category' | 'faq';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  href: string;
}

export interface GlobalSearchProps {
  /** Custom search function (for testing) */
  onSearch?: (query: string) => Promise<SearchResult[]>;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================
// Constants
// ============================================

const DEFAULT_DEBOUNCE_MS = 300; // Requirement 16.2
const MAX_RESULTS_PER_TYPE = 5; // Requirement 16.3

const TYPE_CONFIG: Record<SearchResultType, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  tool: { label: 'Tool', icon: Wrench, color: 'text-blue-600 bg-blue-50' },
  news: { label: 'News', icon: Newspaper, color: 'text-green-600 bg-green-50' },
  prompt: { label: 'Prompt', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
  category: { label: 'Category', icon: Folder, color: 'text-orange-600 bg-orange-50' },
  faq: { label: 'FAQ', icon: HelpCircle, color: 'text-teal-600 bg-teal-50' },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Highlights matching text in a string
 * Requirement 16.7: Highlight matching text
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) {
    return text;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={index} className="bg-yellow-200 text-inherit rounded px-0.5">
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * Default search function that queries Supabase
 * Requirement 16.1: Search across tools, news, prompts, categories, faqs
 */
export async function defaultSearchFunction(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  const supabase = createClient();
  const searchPattern = `%${query}%`;
  const results: SearchResult[] = [];

  try {
    // Search tools (name, slug)
    const { data: tools } = await supabase
      .from('tools')
      .select('id, name, slug')
      .or(`name.ilike.${searchPattern},slug.ilike.${searchPattern}`)
      .limit(MAX_RESULTS_PER_TYPE);

    if (tools) {
      results.push(
        ...tools.map((tool) => ({
          id: tool.id,
          type: 'tool' as const,
          title: tool.name,
          subtitle: tool.slug,
          href: `/admin/tools/${tool.id}/edit`,
        }))
      );
    }

    // Search AI news (title)
    const { data: news } = await supabase
      .from('ai_news')
      .select('id, title, slug')
      .ilike('title', searchPattern)
      .limit(MAX_RESULTS_PER_TYPE);

    if (news) {
      results.push(
        ...news.map((article) => ({
          id: article.id,
          type: 'news' as const,
          title: article.title,
          subtitle: article.slug,
          href: `/admin/news/${article.id}/edit`,
        }))
      );
    }

    // Search prompts (title)
    const { data: prompts } = await supabase
      .from('midjourney_prompts')
      .select('id, title, slug')
      .ilike('title', searchPattern)
      .limit(MAX_RESULTS_PER_TYPE);

    if (prompts) {
      results.push(
        ...prompts.map((prompt) => ({
          id: prompt.id,
          type: 'prompt' as const,
          title: prompt.title,
          subtitle: prompt.slug,
          href: `/admin/prompts/${prompt.id}/edit`,
        }))
      );
    }

    // Search categories (name)
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .ilike('name', searchPattern)
      .limit(MAX_RESULTS_PER_TYPE);

    if (categories) {
      results.push(
        ...categories.map((category) => ({
          id: category.id,
          type: 'category' as const,
          title: category.name,
          subtitle: category.slug,
          href: `/admin/categories/${category.id}/edit`,
        }))
      );
    }

    // Search FAQs (question)
    const { data: faqs } = await supabase
      .from('faqs')
      .select('id, question')
      .ilike('question', searchPattern)
      .limit(MAX_RESULTS_PER_TYPE);

    if (faqs) {
      results.push(
        ...faqs.map((faq) => ({
          id: faq.id,
          type: 'faq' as const,
          title: faq.question.length > 80 ? faq.question.substring(0, 80) + '...' : faq.question,
          href: `/admin/faqs/${faq.id}/edit`,
        }))
      );
    }
  } catch (error) {
    log.error('Global search error', error, { action: 'search' });
  }

  return results;
}

// ============================================
// Search Result Item Component
// ============================================

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function SearchResultItem({ 
  result, 
  query, 
  isSelected, 
  onClick,
  onMouseEnter,
}: SearchResultItemProps) {
  const config = TYPE_CONFIG[result.type];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
        isSelected && 'bg-gray-50'
      )}
      role="option"
      aria-selected={isSelected}
    >
      {/* Type Icon */}
      <div className={cn('p-2 rounded-lg', config.color)}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">
          {highlightMatch(result.title, query)}
        </div>
        {result.subtitle && (
          <div className="text-sm text-gray-500 truncate">
            {highlightMatch(result.subtitle, query)}
          </div>
        )}
      </div>

      {/* Type Label - Requirement 16.4 */}
      <span className={cn(
        'text-xs font-medium px-2 py-1 rounded',
        config.color
      )}>
        {config.label}
      </span>
    </button>
  );
}


// ============================================
// Main GlobalSearch Component
// ============================================

/**
 * GlobalSearch Component
 * 
 * Provides global search functionality across all admin content types.
 * 
 * Requirements:
 * - 16.1: Search across tools (name, slug), ai_news (title), midjourney_prompts (title), 
 *         categories (name), faqs (question)
 * - 16.2: Show results after 300ms debounce
 * - 16.3: Display up to 5 results per content type
 * - 16.4: Show content type label for each result
 * - 16.5: Navigate to edit page on result click
 * - 16.6: Display "No results found" when empty
 * - 16.7: Highlight matching text
 * - 16.8: Close dropdown on Escape key
 */
export function GlobalSearch({
  onSearch = defaultSearchFunction,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  placeholder = 'Search tools, news, prompts...',
  className,
}: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search with debounce - Requirement 16.2
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await onSearch(searchQuery);
      setResults(searchResults);
    } catch (error) {
      log.error('Search error', error, { action: 'performSearch' });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [onSearch]);

  // Handle input change with debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setSelectedIndex(-1);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer - Requirement 16.2
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, debounceMs);
  }, [debounceMs, performSearch]);

  // Handle result click - Requirement 16.5
  const handleResultClick = useCallback((result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    router.push(result.href);
  }, [router]);

  // Handle keyboard navigation - Requirement 16.8
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        // Requirement 16.8: Close dropdown on Escape
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        }
        break;
    }
  }, [results, selectedIndex, handleResultClick]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (query.trim()) {
      setIsOpen(true);
    }
  }, [query]);

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const showDropdown = isOpen && (query.trim().length > 0);
  const hasResults = results.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200',
            'bg-gray-50 text-gray-900 placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-colors'
          )}
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls="global-search-results"
          aria-autocomplete="list"
        />
        
        {/* Loading/Clear Button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div
          id="global-search-results"
          role="listbox"
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'bg-white rounded-lg border border-gray-200 shadow-lg',
            'max-h-[400px] overflow-y-auto'
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-500">Searching...</span>
            </div>
          ) : hasResults ? (
            <div className="py-2">
              {results.map((result, index) => (
                <SearchResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                  query={query}
                  isSelected={index === selectedIndex}
                  onClick={() => handleResultClick(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                />
              ))}
            </div>
          ) : (
            // Requirement 16.6: Display "No results found" when empty
            <div className="py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No results found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export types and utilities for testing
export { TYPE_CONFIG, MAX_RESULTS_PER_TYPE, DEFAULT_DEBOUNCE_MS };
