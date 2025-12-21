"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

export function NewsFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read from URL params
    const currentFilter = searchParams.get('filter') || 'weekly';
    const currentCategory = searchParams.get('category') || 'all';
    const currentSearch = searchParams.get('q') || '';

    const [searchTerm, setSearchTerm] = useState(currentSearch);

    // Sync searchTerm with URL when it changes externally
    useEffect(() => {
        setSearchTerm(currentSearch);
    }, [currentSearch]);

    const periods = ["Daily", "Weekly", "Monthly", "Yearly"];

    const handleFilterChange = (filter: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('filter', filter);
        params.delete('page'); // Reset pagination
        router.push(`/ai-news?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm.trim()) {
            params.set('q', searchTerm.trim());
        } else {
            params.delete('q');
        }
        params.delete('page'); // Reset pagination
        router.push(`/ai-news?${params.toString()}`);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        params.delete('page');
        router.push(`/ai-news?${params.toString()}`);
    };

    // Fix #8: Controlled value from URL instead of defaultValue
    const handleCategoryChange = (category: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (category === 'all') {
            params.delete('category');
        } else {
            params.set('category', category);
        }
        params.delete('page'); // Reset pagination
        router.push(`/ai-news?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 bg-muted/30 p-3 rounded-lg border">
            {/* Time Period Tabs */}
            <div className="flex items-center gap-1 bg-background p-1 rounded-md border shadow-sm overflow-x-auto max-w-full">
                {periods.map((period) => (
                    <button
                        key={period}
                        onClick={() => handleFilterChange(period.toLowerCase())}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap",
                            currentFilter === period.toLowerCase()
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        {period}
                    </button>
                ))}
            </div>

            {/* Search & Category */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Fix #8: Controlled select with value from URL */}
                <select
                    className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={currentCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    <option value="big-tech">Big Tech</option>
                    <option value="startups">Startups</option>
                    <option value="industry-news">Industry News</option>
                    <option value="hardware">Hardware</option>
                    <option value="ethics-safety">Ethics & Safety</option>
                    <option value="applications">Applications</option>
                    <option value="open-source">Open Source</option>
                    <option value="policy-regulation">Policy & Regulation</option>
                    <option value="funding">Funding</option>
                    <option value="research">Research</option>
                    <option value="ai-models">AI Models</option>
                </select>

                <form onSubmit={handleSearch} className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search news..."
                        className="h-9 pl-9 pr-8 w-full sm:w-48 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                        >
                            <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
