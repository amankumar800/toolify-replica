'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  initialQuery?: string;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  initialQuery = '',
  className,
  placeholder = 'Search AI tools, news, prompts...',
  autoFocus = false,
}: SearchInputProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    },
    [query, router]
  );

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative flex items-center bg-white border border-[var(--border)] rounded-xl shadow-sm focus-within:shadow-md focus-within:border-[var(--primary)] transition-all">
        <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full py-3 pl-12 pr-20 bg-transparent border-none outline-none text-base placeholder:text-gray-400"
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-14 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 px-4 py-1.5 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>
    </form>
  );
}
