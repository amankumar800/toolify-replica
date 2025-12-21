'use client';

import { CompactToolCard } from './CompactToolCard';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { FeaturedTool } from '@/lib/types/home.types';
import { INITIAL_TOOLS_COUNT } from '@/lib/constants/home.constants';

interface ToolCardsGridProps {
    /** Array of tools to display */
    tools: FeaturedTool[];
    /** How many tools to show initially */
    initialCount?: number;
    /** Current filter tab (for context in More button) */
    activeFilter?: string;
}

/**
 * Tool Cards Grid - Displays a responsive grid of tool cards with More button
 * 
 * Fixes applied:
 * - #3: Removed dead showAll state
 * - #7: Focus-visible on More button
 * - #22: Props-based data pattern
 * - #24: Shared types
 * - #26: Using constants for initialCount
 * - #36: Empty state
 * - #40: Fixed More button to use activeFilter context
 */
export function ToolCardsGrid({
    tools,
    initialCount = INITIAL_TOOLS_COUNT,
    activeFilter = 'new'
}: ToolCardsGridProps) {
    // Issue #3: Removed unused showAll state - just slice to initialCount
    const displayedTools = tools.slice(0, initialCount);
    const hasMore = tools.length > initialCount;

    // Issue #36: Empty state
    if (!tools || tools.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-3">🔍</div>
                <p className="text-gray-500 font-medium">No tools found</p>
                <p className="text-gray-400 text-sm mt-1">Check back later for new additions!</p>
            </div>
        );
    }

    // Issue #40: Map filter to correct href
    const moreHref = getMoreHref(activeFilter);

    return (
        <div>
            {/* Grid - Issue #42: Proper spacing for touch targets */}
            <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                role="tabpanel"
                id={`tabpanel-${activeFilter}`}
                aria-label={`${activeFilter} tools`}
            >
                {displayedTools.map((tool) => (
                    <CompactToolCard
                        key={tool.id}
                        {...tool}
                    />
                ))}
            </div>

            {/* More Button - Issue #40: Fixed href */}
            {hasMore && (
                <div className="flex justify-center">
                    <Link
                        href={moreHref}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-full font-medium text-sm hover:opacity-90 transition-all shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none touch-target"
                    >
                        More
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                </div>
            )}
        </div>
    );
}

/**
 * Map filter tab ID to the correct "More" page href
 * Issue #40: Correct routing for each filter
 */
function getMoreHref(filter: string): string {
    const routes: Record<string, string> = {
        'today': '/new',
        'new': '/new',
        'most-saved': '/most-saved',
        'most-used': '/most-used',
        'browser-extension': '/browser-extension',
        'apps': '/apps',
        'discord': '/discord',
    };
    return routes[filter] || '/new';
}
