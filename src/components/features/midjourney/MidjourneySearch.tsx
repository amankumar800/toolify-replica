'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MidjourneySearchProps {
    className?: string;
    placeholder?: string;
}

export function MidjourneySearch({
    className,
    placeholder = "Search Midjourney styles... e.g. 'anime'"
}: MidjourneySearchProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/midjourney-library?search=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form
            onSubmit={handleSearch}
            className={cn(
                "relative w-full max-w-2xl mx-auto",
                className
            )}
        >
            <div
                className={cn(
                    "relative flex items-center bg-white/10 backdrop-blur-sm border rounded-full overflow-hidden transition-all duration-300",
                    isFocused
                        ? "border-purple-500 ring-2 ring-purple-500/30 bg-white/15"
                        : "border-white/20 hover:border-white/40"
                )}
            >
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent px-6 py-4 text-white placeholder:text-gray-400 focus:outline-none text-base"
                />
                <button
                    type="submit"
                    className="flex items-center justify-center h-12 w-12 mr-2 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors shrink-0"
                    aria-label="Search"
                >
                    <Search className="w-5 h-5 text-white" />
                </button>
            </div>
        </form>
    );
}
