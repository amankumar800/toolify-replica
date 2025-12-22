'use client';

import { cn } from '@/lib/utils';

interface TagCloudProps {
    tags: { tag: string; count: number }[];
    activeTag?: string;
    onTagClick?: (tag: string) => void;
    className?: string;
}

export function TagCloud({ tags, activeTag, onTagClick, className }: TagCloudProps) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {/* All button */}
            <button
                onClick={() => onTagClick?.('')}
                className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    !activeTag
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                        : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/10"
                )}
            >
                All
            </button>

            {tags.map(({ tag, count }) => (
                <button
                    key={tag}
                    onClick={() => onTagClick?.(tag)}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize",
                        activeTag === tag
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                            : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/10"
                    )}
                >
                    {tag} <span className="text-gray-400 ml-1">({count.toLocaleString()})</span>
                </button>
            ))}
        </div>
    );
}
