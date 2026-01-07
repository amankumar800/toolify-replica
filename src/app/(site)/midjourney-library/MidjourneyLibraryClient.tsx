'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { MasonryGrid } from '@/components/features/MasonryGrid';
import { PromptCard } from '@/components/features/PromptCard';
import {
    MidjourneySearch,
    TagCloud,
    FiltersModal,
    FAQAccordion,
    SocialShare,
    SortDropdown
} from '@/components/features/midjourney';
import { Prompt, FilterGroup, FAQ } from '@/lib/types/prompt';
import { ChevronRight, ArrowUp, SearchX, Loader2 } from 'lucide-react';

interface MidjourneyLibraryClientProps {
    initialPrompts: Prompt[];
    tagCounts: { tag: string; count: number }[];
    filterGroups: FilterGroup[];
    faqs: FAQ[];
}

const ITEMS_PER_PAGE = 20;

export function MidjourneyLibraryClient({
    initialPrompts,
    tagCounts,
    filterGroups,
    faqs
}: MidjourneyLibraryClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read URL params on mount
    const urlSearch = searchParams.get('search') || '';
    const urlType = searchParams.get('type') || 'all';

    // State
    const [searchQuery, setSearchQuery] = useState(urlSearch);
    const [activeTag, setActiveTag] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [typeFilter, setTypeFilter] = useState(urlType);
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [showAllTags, setShowAllTags] = useState(false);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Lifted state for exclusive dropdown
    const [openDropdown, setOpenDropdown] = useState<'sort' | 'type' | null>(null);

    // Sync URL params to state on mount and URL changes
    useEffect(() => {
        setSearchQuery(urlSearch);
        setTypeFilter(urlType);
    }, [urlSearch, urlType]);

    // Fuzzy search function
    const fuzzyMatch = useCallback((prompt: Prompt, query: string): boolean => {
        if (!query.trim()) return true;
        const q = query.toLowerCase().trim();
        const searchableText = [
            prompt.promptText,
            prompt.styleTitle,
            prompt.styleDescription,
            prompt.srefCode,
            ...prompt.tags
        ].filter(Boolean).join(' ').toLowerCase();

        // Match any word in query
        const terms = q.split(/\s+/);
        return terms.some(term => searchableText.includes(term));
    }, []);

    // Filter and sort prompts
    const filteredPrompts = useMemo(() => {
        let result = [...initialPrompts];

        // 1. Filter by search query (instant/fuzzy)
        if (searchQuery.trim()) {
            result = result.filter(p => fuzzyMatch(p, searchQuery));
        }

        // 2. Filter by active tag
        if (activeTag) {
            result = result.filter(p => p.tags.includes(activeTag));
        }

        // 3. Filter by type
        if (typeFilter === 'sref') {
            result = result.filter(p => p.type === 'sref');
        } else if (typeFilter === 'prompt') {
            result = result.filter(p => p.type === 'prompt');
        }

        // 4. Apply advanced filters
        Object.entries(selectedFilters).forEach(([groupId, categoryIds]) => {
            if (categoryIds.length > 0) {
                result = result.filter(p => {
                    // Match prompts that have any of the selected categories
                    return categoryIds.some(catId => {
                        // Match by category or tags
                        return p.category === catId || p.tags.includes(catId);
                    });
                });
            }
        });

        // 5. Sort
        if (sortBy === 'popular') {
            result.sort((a, b) => b.likes - a.likes);
        } else if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        } else if (sortBy === 'views') {
            result.sort((a, b) => b.views - a.views);
        }

        return result;
    }, [initialPrompts, searchQuery, activeTag, typeFilter, sortBy, selectedFilters, fuzzyMatch]);

    // Paginated prompts
    const paginatedPrompts = useMemo(() => {
        return filteredPrompts.slice(0, visibleCount);
    }, [filteredPrompts, visibleCount]);

    const hasMore = visibleCount < filteredPrompts.length;

    // Handle filter changes
    const handleFilterChange = (groupId: string, categoryId: string) => {
        setSelectedFilters(prev => {
            const group = prev[groupId] || [];
            if (group.includes(categoryId)) {
                return { ...prev, [groupId]: group.filter(id => id !== categoryId) };
            }
            return { ...prev, [groupId]: [...group, categoryId] };
        });
    };

    // Handle tag click
    const handleTagClick = (tag: string) => {
        setActiveTag(tag);
        setVisibleCount(ITEMS_PER_PAGE); // Reset pagination
    };

    // Handle search change (instant filtering)
    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setVisibleCount(ITEMS_PER_PAGE); // Reset pagination
    };

    // Handle search submit (update URL)
    const handleSearchSubmit = (query: string) => {
        if (query.trim()) {
            router.push(`/midjourney-library?search=${encodeURIComponent(query.trim())}`, { scroll: false });
        } else {
            router.push('/midjourney-library', { scroll: false });
        }
    };

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setActiveTag('');
        setTypeFilter('all');
        setSelectedFilters({});
        setSortBy('default');
        setVisibleCount(ITEMS_PER_PAGE);
        router.push('/midjourney-library', { scroll: false });
    };

    // Load more
    const loadMore = () => {
        setIsLoadingMore(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
            setVisibleCount(prev => prev + ITEMS_PER_PAGE);
            setIsLoadingMore(false);
        }, 300);
    };

    // Back to top scroll listener
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery.trim() || activeTag || typeFilter !== 'all' || Object.values(selectedFilters).some(arr => arr.length > 0);
    const totalSelectedFilters = Object.values(selectedFilters).flat().length;

    // Tags to display
    const displayedTags = showAllTags ? tagCounts : tagCounts.slice(0, 12);

    return (
        <div className="min-h-screen bg-[#0b0f19] pb-20">
            {/* Hero Section - Reduced height */}
            <div className="relative bg-gradient-to-br from-purple-900/50 via-[#0b0f19] to-blue-900/30 border-b border-gray-800 py-10 md:py-16">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                </div>

                <Container className="relative text-center">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        <span className="text-white" aria-current="page">Midjourney Library</span>
                    </nav>

                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                        The Ultimate Midjourney SREF, Prompt, and Style Library
                    </h1>
                    <p className="text-gray-300 max-w-3xl mx-auto text-base md:text-lg mb-8 leading-relaxed">
                        Explore thousands of curated Midjourney styles, SREF codes, and high-quality prompts.
                    </p>

                    {/* Search Bar - With instant filtering */}
                    <MidjourneySearch
                        className="mb-6"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onSubmit={handleSearchSubmit}
                    />

                    {/* Social Share */}
                    <div className="flex justify-center">
                        <SocialShare />
                    </div>
                </Container>
            </div>

            {/* Filters & Content Section */}
            <Container fluid className="px-4 md:px-8 py-8">
                {/* Filter Bar */}
                <div className="mb-8 space-y-4">
                    {/* Tag Cloud with Show More */}
                    <div className="space-y-2">
                        <TagCloud
                            tags={displayedTags}
                            activeTag={activeTag}
                            onTagClick={handleTagClick}
                        />
                        {tagCounts.length > 12 && (
                            <button
                                onClick={() => setShowAllTags(!showAllTags)}
                                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                {showAllTags ? 'Show less' : `Show ${tagCounts.length - 12} more tags`}
                            </button>
                        )}
                    </div>

                    {/* Dropdowns and Filters - Better mobile layout */}
                    <div className="flex flex-wrap items-center gap-3">
                        <SortDropdown
                            label="Sort by:"
                            value={sortBy}
                            onChange={setSortBy}
                            options={[
                                { value: 'default', label: 'Default' },
                                { value: 'popular', label: 'Most Popular' },
                                { value: 'newest', label: 'Newest' },
                                { value: 'views', label: 'Most Viewed' }
                            ]}
                            isOpen={openDropdown === 'sort'}
                            onOpenChange={(open) => setOpenDropdown(open ? 'sort' : null)}
                        />

                        <SortDropdown
                            label="Type:"
                            value={typeFilter}
                            onChange={(val) => {
                                setTypeFilter(val);
                                setVisibleCount(ITEMS_PER_PAGE);
                            }}
                            options={[
                                { value: 'all', label: 'All Types' },
                                { value: 'sref', label: 'SREF Codes' },
                                { value: 'prompt', label: 'Prompts' }
                            ]}
                            isOpen={openDropdown === 'type'}
                            onOpenChange={(open) => setOpenDropdown(open ? 'type' : null)}
                        />

                        <FiltersModal
                            filterGroups={filterGroups}
                            selectedFilters={selectedFilters}
                            onFilterChange={handleFilterChange}
                            onClearAll={() => setSelectedFilters({})}
                        />

                        {/* Active filters indicator */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors"
                            >
                                Clear all
                            </button>
                        )}

                        {/* Results count - Better alignment */}
                        <span className="text-sm text-gray-400 ml-auto">
                            {filteredPrompts.length} {filteredPrompts.length === 1 ? 'result' : 'results'}
                            {hasActiveFilters && ' (filtered)'}
                        </span>
                    </div>
                </div>

                {/* Empty State */}
                {filteredPrompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6">
                            <SearchX className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                        <p className="text-gray-400 mb-6 max-w-md">
                            We couldn't find any prompts matching your criteria. Try adjusting your filters or search terms.
                        </p>
                        <button
                            onClick={clearAllFilters}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Prompt Grid */}
                        <MasonryGrid>
                            {paginatedPrompts.map(prompt => (
                                <PromptCard
                                    key={prompt.id}
                                    prompt={prompt}
                                    onTagClick={handleTagClick}
                                />
                            ))}
                        </MasonryGrid>

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center mt-12">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            Load More ({filteredPrompts.length - visibleCount} remaining)
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Showing count */}
                        <div className="text-center mt-6 text-sm text-gray-400">
                            Showing {paginatedPrompts.length} of {filteredPrompts.length} prompts
                        </div>
                    </>
                )}

                {/* CTA Buttons - Primary/Secondary distinction */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-16">
                    <Link
                        href="/midjourney-library?type=sref"
                        className="px-8 py-4 text-center rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/30"
                    >
                        Browse All SREF Codes
                    </Link>
                    <Link
                        href="/midjourney-library?type=prompt"
                        className="px-8 py-4 text-center rounded-full border-2 border-blue-500 text-blue-400 font-semibold hover:bg-blue-500/10 transition-all duration-300 hover:scale-105"
                    >
                        Browse All Prompts
                    </Link>
                </div>

                {/* FAQ Section */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <FAQAccordion faqs={faqs} />
                </div>
            </Container>

            {/* Back to Top FAB */}
            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 animate-in fade-in slide-in-from-bottom-4"
                    aria-label="Back to top"
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
