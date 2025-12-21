"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface LoadMoreButtonProps {
    currentPage: number;
}

export function LoadMoreButton({ currentPage }: LoadMoreButtonProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLoadMore = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(currentPage + 1));
        router.push(`/ai-news?${params.toString()}`, { scroll: false });
    };

    return (
        <button
            onClick={handleLoadMore}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
            <span>Load More</span>
            <ChevronDown className="w-4 h-4" />
        </button>
    );
}
