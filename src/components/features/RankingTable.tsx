'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type Tool } from '@/lib/types/tool';
import { RankBadge } from '@/components/ui/badge-rank';
import { TrendingUp, TrendingDown, ArrowUpDown, ChevronUp, ChevronDown, Filter, Search, X } from 'lucide-react';

interface RankingTableProps {
    tools: Tool[];
}

type SortOrder = 'none' | 'asc' | 'desc';
type PricingFilter = 'all' | 'Free' | 'Freemium' | 'Paid' | 'Free Trial';

const PRICING_OPTIONS: { value: PricingFilter; label: string }[] = [
    { value: 'all', label: 'All Pricing' },
    { value: 'Free', label: 'Free' },
    { value: 'Freemium', label: 'Freemium' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Free Trial', label: 'Free Trial' },
];

function PricingBadge({ pricing }: { pricing: string }) {
    const colors: Record<string, string> = {
        'Free': 'bg-green-100 text-green-700',
        'Freemium': 'bg-blue-100 text-blue-700',
        'Paid': 'bg-orange-100 text-orange-700',
        'Free Trial': 'bg-purple-100 text-purple-700',
    };
    const colorClass = colors[pricing] || 'bg-gray-100 text-gray-600';

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
            {pricing}
        </span>
    );
}

function formatNumber(num?: number) {
    if (!num) return 'N/A';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function TrendIndicator({ change }: { change?: number }) {
    if (change === undefined) return <span className="text-gray-300">—</span>;
    if (change > 0) {
        return (
            <span className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                {change}%
            </span>
        );
    }
    if (change < 0) {
        return (
            <span className="flex items-center text-red-500 text-sm font-medium">
                <TrendingDown className="w-4 h-4 mr-1" />
                {Math.abs(change)}%
            </span>
        );
    }
    return <span className="text-gray-400 text-sm">0%</span>;
}

/**
 * Fuzzy search implementation
 * - Case insensitive
 * - Matches partial words (typing "chat" matches "ChatGPT")
 * - Matches any word in query (typing "ai image" matches tools with "ai" OR "image")
 * - Searches across name, description, and tags
 */
function fuzzyMatch(tool: Tool, query: string): boolean {
    if (!query.trim()) return true;

    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    const searchableText = [
        tool.name,
        tool.shortDescription,
        tool.description,
        ...(tool.tags || []),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    // Match if ANY search term is found (OR logic for better partial matching)
    return searchTerms.some(term => searchableText.includes(term));
}

/**
 * Calculate match score for ranking search results
 * Higher score = better match
 */
function getMatchScore(tool: Tool, query: string): number {
    if (!query.trim()) return 0;

    const q = query.toLowerCase().trim();
    const name = tool.name.toLowerCase();

    // Exact name match = highest score
    if (name === q) return 100;

    // Name starts with query = very high score
    if (name.startsWith(q)) return 90;

    // Name contains query = high score
    if (name.includes(q)) return 80;

    // Check individual words in query
    const terms = q.split(/\s+/);
    let score = 0;

    for (const term of terms) {
        if (name.includes(term)) score += 30;
        else if (tool.shortDescription?.toLowerCase().includes(term)) score += 20;
        else if (tool.description?.toLowerCase().includes(term)) score += 10;
        else if (tool.tags?.some(tag => tag.toLowerCase().includes(term))) score += 15;
    }

    return score;
}

export function RankingTable({ tools }: RankingTableProps) {
    const [sortOrder, setSortOrder] = useState<SortOrder>('none');
    const [pricingFilter, setPricingFilter] = useState<PricingFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleTrendSort = () => {
        if (sortOrder === 'none') setSortOrder('desc');
        else if (sortOrder === 'desc') setSortOrder('asc');
        else setSortOrder('none');
    };

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Filter and sort tools
    const displayTools = useMemo(() => {
        let result = tools;

        // 1. Apply search filter (fuzzy matching)
        if (searchQuery.trim()) {
            result = result
                .filter(tool => fuzzyMatch(tool, searchQuery))
                .sort((a, b) => getMatchScore(b, searchQuery) - getMatchScore(a, searchQuery));
        }

        // 2. Apply pricing filter
        if (pricingFilter !== 'all') {
            result = result.filter(tool => tool.pricing === pricingFilter);
        }

        // 3. Apply trend sort (only if not searching, as search has its own ranking)
        if (sortOrder !== 'none' && !searchQuery.trim()) {
            result = [...result].sort((a, b) => {
                const aVal = a.changePercentage ?? 0;
                const bVal = b.changePercentage ?? 0;
                return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
            });
        }

        return result;
    }, [tools, searchQuery, pricingFilter, sortOrder]);

    const isFiltered = searchQuery.trim() || pricingFilter !== 'all';

    return (
        <div>
            {/* Search and Filters Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tools by name, description..."
                        className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        aria-label="Search tools"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 justify-end">
                    {/* Trend Sort */}
                    <button
                        onClick={handleTrendSort}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            sortOrder !== 'none'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {sortOrder === 'none' && <ArrowUpDown className="w-4 h-4" />}
                        {sortOrder === 'desc' && <ChevronDown className="w-4 h-4" />}
                        {sortOrder === 'asc' && <ChevronUp className="w-4 h-4" />}
                        Trend
                    </button>

                    {/* Pricing Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            value={pricingFilter}
                            onChange={(e) => setPricingFilter(e.target.value as PricingFilter)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-colors ${
                                pricingFilter !== 'all'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {PRICING_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            {isFiltered && (
                <div className="text-sm text-gray-500 mb-3">
                    {displayTools.length === 0 ? (
                        'No tools found'
                    ) : (
                        <>
                            Showing {displayTools.length} tool{displayTools.length !== 1 ? 's' : ''}
                            {searchQuery.trim() && ` matching "${searchQuery.trim()}"`}
                            {pricingFilter !== 'all' && ` • ${pricingFilter}`}
                        </>
                    )}
                </div>
            )}

            {/* Tools List */}
            <div className="space-y-2">
                {displayTools.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No tools found</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Try adjusting your search or filters
                        </p>
                        {isFiltered && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setPricingFilter('all');
                                    setSortOrder('none');
                                }}
                                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    displayTools.map((tool, index) => (
                        <Link
                            key={tool.id}
                            href={`/tool/${tool.slug}`}
                            className="flex items-center gap-6 p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                        >
                            {/* Rank */}
                            <div className="flex-shrink-0">
                                <RankBadge rank={isFiltered ? tools.indexOf(tool) + 1 : index + 1} />
                            </div>

                            {/* Logo */}
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                                {tool.image ? (
                                    <Image
                                        src={tool.image}
                                        alt={tool.name}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                                        {tool.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            {/* Name + Description */}
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {tool.name}
                                </div>
                                <div className="text-sm text-gray-500 line-clamp-1">
                                    {tool.shortDescription || tool.description}
                                </div>
                            </div>

                            {/* Monthly Visits */}
                            <div className="hidden sm:block text-right flex-shrink-0 min-w-[80px] px-2">
                                <div className="font-mono text-sm font-medium text-gray-700">
                                    {formatNumber(tool.monthlyVisits)}
                                </div>
                                <div className="text-xs text-gray-400">visits</div>
                            </div>

                            {/* Divider */}
                            <div className="hidden sm:block w-px h-8 bg-gray-200 flex-shrink-0 mx-1" />

                            {/* Trend Indicator */}
                            <div className="hidden sm:flex items-center justify-center flex-shrink-0 min-w-[80px] px-2">
                                <TrendIndicator change={tool.changePercentage} />
                            </div>

                            {/* Divider */}
                            <div className="hidden sm:block w-px h-8 bg-gray-200 flex-shrink-0 mx-1" />

                            {/* Pricing */}
                            <div className="flex-shrink-0 min-w-[90px] text-center px-2">
                                <PricingBadge pricing={tool.pricing} />
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
