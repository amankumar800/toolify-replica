'use client';

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchToolsAction } from '@/app/actions';
import { Tool } from '@/lib/types/tool';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SearchBarProps {
    className?: string;
    variant?: 'hero' | 'header';
}

export function SearchBar({ className, variant = 'header' }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Tool[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                try {
                    const data = await searchToolsAction(query);
                    setResults(data);
                    setIsOpen(true);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (tool: Tool) => {
        router.push(`/tool/${tool.slug}`);
        setIsOpen(false);
        setQuery('');
    };

    const isHero = variant === 'hero';

    return (
        <div ref={wrapperRef} className={cn('relative max-w-2xl w-full', className)}>
            <div className={cn(
                'relative flex items-center bg-white border border-[var(--border)] transition-shadow duration-200 focus-within:shadow-lg focus-within:border-[var(--primary)]',
                isHero ? 'h-14 rounded-full px-6 shadow-md' : 'h-10 rounded-[var(--radius-sm)] px-3'
            )}>
                <SearchIcon className={cn(
                    'text-[var(--muted-foreground)] flex-shrink-0',
                    isHero ? 'w-6 h-6 mr-3' : 'w-4 h-4 mr-2'
                )} />

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={isHero ? "Search 10,000+ AI Tools..." : "Search..."}
                    className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-gray-400 w-full"
                    aria-label="Search AI tools"
                />

                {loading && <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />}

                {query.length > 0 && !loading && (
                    <button type="button" onClick={() => { setQuery(''); setIsOpen(false); }} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Typeahead Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[var(--radius)] shadow-xl border border-[var(--border)] overflow-hidden z-50">
                    <div className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Tools
                        </div>
                        {results.map((tool) => (
                            <div
                                key={tool.id}
                                onClick={() => handleSelect(tool)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)] cursor-pointer min-h-[48px] transition-colors"
                                role="option"
                            >
                                {tool.image && (
                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                        <Image src={tool.image} alt={tool.name} fill className="object-cover" sizes="32px" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{tool.name}</div>
                                    <div className="text-xs text-gray-500 truncate">{tool.shortDescription}</div>
                                </div>
                                <span className="text-xs text-[var(--primary)] font-medium bg-purple-50 px-2 py-0.5 rounded-full">
                                    {tool.pricing}
                                </span>
                            </div>
                        ))}
                        <div
                            onClick={() => { router.push(`/?q=${query}`); setIsOpen(false); }}
                            className="block px-4 py-3 text-center text-sm font-medium text-[var(--primary)] border-t border-[var(--border)] hover:bg-gray-50 cursor-pointer min-h-[48px] flex items-center justify-center"
                        >
                            View all results for "{query}"
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
