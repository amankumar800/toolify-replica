'use client';

import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useCategoryBrowser } from '@/lib/context/CategoryBrowserContext';
import { cn } from '@/lib/utils';

export function CategoryControlBar() {
    const { searchQuery, setSearchQuery, sortBy, setSortBy } = useCategoryBrowser();

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search Input */}
            <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-toolify-purple-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search over 10,000+ tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-toolify-black placeholder:text-gray-400 focus:outline-none focus:border-toolify-purple-300 focus:ring-4 focus:ring-toolify-purple-50/50 transition-all shadow-sm"
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'popular' | 'newest')}
                        className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-toolify-gray-600 focus:outline-none focus:border-toolify-purple-300 focus:ring-4 focus:ring-toolify-purple-50/50 cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                    >
                        <option value="popular">Most Popular</option>
                        <option value="newest">Newest Added</option>
                    </select>
                    <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
