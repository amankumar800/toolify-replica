'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
import { ChevronRight, ArrowUp } from 'lucide-react';

interface MidjourneyLibraryClientProps {
    initialPrompts: Prompt[];
    tagCounts: { tag: string; count: number }[];
    filterGroups: FilterGroup[];
    faqs: FAQ[];
}

export function MidjourneyLibraryClient({
    initialPrompts,
    tagCounts,
    filterGroups,
    faqs
}: MidjourneyLibraryClientProps) {
    const [activeTag, setActiveTag] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
    const [showBackToTop, setShowBackToTop] = useState(false);

    // Lifted state for exclusive dropdown - only one can be open at a time
    const [openDropdown, setOpenDropdown] = useState<'sort' | 'type' | null>(null);

    // Filter and sort prompts
    const filteredPrompts = useMemo(() => {
        let result = [...initialPrompts];

        // Filter by active tag
        if (activeTag) {
            result = result.filter(p => p.tags.includes(activeTag));
        }

        // Filter by type
        if (typeFilter === 'sref') {
            result = result.filter(p => p.type === 'sref');
        } else if (typeFilter === 'prompt') {
            result = result.filter(p => p.type === 'prompt');
        }

        // Sort
        if (sortBy === 'popular') {
            result.sort((a, b) => b.likes - a.likes);
        } else if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        } else if (sortBy === 'views') {
            result.sort((a, b) => b.views - a.views);
        }

        return result;
    }, [initialPrompts, activeTag, typeFilter, sortBy]);

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

    return (
        <div className="min-h-screen bg-[#0b0f19] pb-20">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-purple-900/50 via-[#0b0f19] to-blue-900/30 border-b border-gray-800 py-16 md:py-24">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                </div>

                <Container className="relative text-center">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-8">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Midjourney Library</span>
                    </nav>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                        The Ultimate Midjourney SREF, Prompt, and Style Library
                    </h1>
                    <p className="text-gray-400 max-w-3xl mx-auto text-lg md:text-xl mb-10 leading-relaxed">
                        Explore thousands of curated Midjourney styles, SREF codes, and high-quality prompts.
                        The most comprehensive collection for your next AI art masterpiece.
                    </p>

                    {/* Search Bar */}
                    <MidjourneySearch className="mb-8" />

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
                    {/* Tag Cloud */}
                    <TagCloud
                        tags={tagCounts.slice(0, 12)}
                        activeTag={activeTag}
                        onTagClick={setActiveTag}
                    />

                    {/* Dropdowns and Filters Button */}
                    <div className="flex flex-wrap items-end gap-4">
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
                            onChange={setTypeFilter}
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

                        {/* Results count */}
                        <span className="text-sm text-[var(--color-text-secondary)] ml-auto flex items-end h-[var(--dropdown-button-height)]">
                            {filteredPrompts.length} results
                        </span>
                    </div>
                </div>

                {/* Prompt Grid */}
                <MasonryGrid>
                    {filteredPrompts.map(prompt => (
                        <PromptCard key={prompt.id} prompt={prompt} />
                    ))}
                </MasonryGrid>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-16">
                    <Link
                        href="/midjourney-library?type=sref"
                        className="px-8 py-4 text-center rounded-full border-2 border-purple-500 text-purple-400 font-semibold hover:bg-purple-500/10 transition-all duration-300 hover:scale-105"
                    >
                        All Midjourney SREF Codes
                    </Link>
                    <Link
                        href="/midjourney-library?type=prompt"
                        className="px-8 py-4 text-center rounded-full border-2 border-blue-500 text-blue-400 font-semibold hover:bg-blue-500/10 transition-all duration-300 hover:scale-105"
                    >
                        All Midjourney Prompts
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
