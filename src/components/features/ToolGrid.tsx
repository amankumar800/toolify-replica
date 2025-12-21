'use client';

import { useState, useEffect } from 'react';
import { Tool } from '@/lib/types/tool';
import { ToolCard } from './ToolCard';
import { ToolCardSkeleton } from './ToolCardSkeleton';
import { filterToolsAction } from '@/app/actions';
import { Loader2, AlertCircle } from 'lucide-react';

interface ToolGridProps {
    initialTools: Tool[]; // SSR Hydration Data
    category?: string;
}

export function ToolGrid({ initialTools, category }: ToolGridProps) {
    const [tools, setTools] = useState<Tool[]>(initialTools);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Senior Dev Fix: State Sync
    // If props change (filtering from parent), reset the list.
    useEffect(() => {
        setTools(initialTools);
        setPage(1);
        setHasMore(true);
        setError(null);
    }, [initialTools, category]);

    const loadMore = async () => {
        if (loading) return;

        setLoading(true);
        setError(null);

        // Analytics Stub
        console.log('[Analytics] Load More Clicked', { category, page: page + 1 });

        const nextPage = page + 1;

        try {
            const newTools = await filterToolsAction(category, nextPage);

            if (newTools.length === 0) {
                setHasMore(false);
            } else {
                // Robust Deduplication: Prevent ID collisions
                setTools(prev => {
                    const uniqueNewTools = newTools.filter(
                        nt => !prev.some(existing => existing.id === nt.id)
                    );

                    if (uniqueNewTools.length === 0) {
                        setHasMore(false);
                        return prev;
                    }

                    return [...prev, ...uniqueNewTools];
                });
                setPage(nextPage);
            }
        } catch (e) {
            console.error("Failed to load more tools", e);
            setError("Failed to load more tools. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map((tool, index) => (
                    <ToolCard
                        key={`${tool.id}-${index}`}
                        tool={tool}
                        priority={index < 8}
                    />
                ))}

                {/* Loading State: Show skeletons while fetching */}
                {loading && Array.from({ length: 4 }).map((_, i) => (
                    <ToolCardSkeleton key={`skeleton-${i}`} />
                ))}
            </div>

            <div className="mt-16 flex flex-col items-center justify-center gap-4">
                {error && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {hasMore ? (
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className={`
                            group relative px-8 py-3 rounded-full font-medium transition-all duration-300
                            border cursor-pointer
                            ${loading
                                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white border-gray-200 text-slate-700 hover:border-violet-500 hover:text-violet-600 hover:shadow-md active:scale-95'
                            }
                        `}
                    >
                        <span className="flex items-center gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Loading...' : 'View More Tools'}
                        </span>
                    </button>
                ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        You&apos;ve reached the end of the list.
                    </div>
                )}
            </div>
        </div>
    );
}
