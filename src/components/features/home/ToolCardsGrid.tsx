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
 * Converted to Server Component - no client-side state needed
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
    // Just slice to initialCount - no state needed
    const displayedTools = tools.slice(0, initialCount);

    // Filters that have dedicated pages should always show "More" button
    const filtersWithDedicatedPages = ['apps', 'browser-extension', 'discord'];
    const hasDedicatedPage = filtersWithDedicatedPages.includes(activeFilter);
    const hasMore = tools.length > initialCount || (hasDedicatedPage && tools.length > 0);

    // Filter-specific empty state messages
    const emptyMessages: Record<string, { icon: string; title: string; subtitle: string }> = {
        'apps': { icon: '📱', title: 'No mobile apps found yet', subtitle: "We're still adding apps to our directory." },
        'browser-extension': { icon: '🧩', title: 'No extensions found yet', subtitle: 'Browser extensions coming soon!' },
        'discord': { icon: '🤖', title: 'No Discord bots found yet', subtitle: 'Discord AI bots will be added shortly!' },
        'most-saved': { icon: '⭐', title: 'No saved tools yet', subtitle: 'Tools will appear as users save them.' },
        'most-used': { icon: '📊', title: 'No usage data yet', subtitle: 'Check back soon for popular tools!' },
        'new': { icon: '✨', title: 'No new tools this week', subtitle: 'Check back soon for the latest additions!' },
        'default': { icon: '🔍', title: 'No tools found', subtitle: 'Check back later for new additions!' }
    };

    // Issue #36: Filter-aware empty state
    if (!tools || tools.length === 0) {
        const msg = emptyMessages[activeFilter] || emptyMessages.default;
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-3">{msg.icon}</div>
                <p className="text-gray-500 font-medium">{msg.title}</p>
                <p className="text-gray-400 text-sm mt-1">{msg.subtitle}</p>
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
