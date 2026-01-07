'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchModal({ isOpen, onClose }: MobileSearchModalProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        onClose();
        setQuery('');
      }
    },
    [query, router, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-0 z-50 bg-white p-4 shadow-xl animate-in slide-in-from-top duration-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search AI tools, news, prompts..."
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border-none outline-none text-base placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--primary)]"
              autoFocus
              aria-label="Search"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-3 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close search"
          >
            <X className="w-6 h-6" />
          </button>
        </form>

        {/* Search suggestions */}
        <div className="mt-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Popular searches
          </div>
          <div className="flex flex-wrap gap-2">
            {['ChatGPT', 'Image Generator', 'Writing Tools', 'Code Assistant', 'Video AI'].map(
              (suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                >
                  {suggestion}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
