'use client';

import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Tool } from '@/lib/types/tool';
import { ToolCard } from './ToolCard';
import { ToolCardSkeleton } from './ToolCardSkeleton';
import { searchToolsAction, filterToolsAction } from '@/app/actions';

interface ToolGridProps {
    initialTools: Tool[]; // SSR Hydration Data
    category?: string;
}

export function ToolGrid({ initialTools, category }: ToolGridProps) {
    const [tools, setTools] = useState<Tool[]>(initialTools);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const { ref, inView } = useInView();

    // Load more when inView
    useEffect(() => {
        if (inView && hasMore && !loading) {
            loadMore();
        }
    }, [inView, hasMore, loading]);

    const loadMore = async () => {
        setLoading(true);
        const nextPage = page + 1;
        try {
            const { tools: newTools, total } = await filterToolsAction(category, nextPage);

            if (newTools.length === 0) {
                setHasMore(false);
            } else {
                setTools(prev => [...prev, ...newTools]);
                setPage(nextPage);
            }
        } catch (e) {
            console.error("Failed to load more tools", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map((tool, index) => (
                    <ToolCard
                        key={`${tool.id}-${index}`} // Hybrid key to handle potential duplicate mock data if simplistic
                        tool={tool}
                        priority={index < 8} // LCP Boost for first 8
                    />
                ))}

                {/* Skeleton loaders for next page */}
                {loading && Array.from({ length: 4 }).map((_, i) => (
                    <ToolCardSkeleton key={`skeleton-${i}`} />
                ))}
            </div>

            {/* Sentinel for Infinite Scroll */}
            {hasMore && <div ref={ref} className="h-20 flex items-center justify-center opacity-0">Loading...</div>}

            {!hasMore && (
                <div className="text-center py-12 text-gray-400 text-sm">
                    You&apos;ve reached the end of the list.
                </div>
            )}
        </div>
    );
}
