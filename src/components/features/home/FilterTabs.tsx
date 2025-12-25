'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CheckCircle2, Calendar, Sparkles, Bookmark, Globe, Smartphone, MessageCircle } from 'lucide-react';
import { FilterTab } from '@/lib/types/home.types';
import { FILTER_TAB_IDS } from '@/lib/constants/home.constants';

/**
 * Default filter tabs matching AI Tools Book exactly
 */
const defaultTabs: FilterTab[] = [
    { id: 'today', label: 'Today' },
    { id: 'new', label: 'New' },
    { id: 'most-saved', label: 'Most Saved' },
    { id: 'most-used', label: 'Most Used' },
    { id: 'browser-extension', label: 'Browser Extension' },
    { id: 'apps', label: 'Apps' },
    { id: 'discord', label: 'Discord of AI' },
];

// Map tab IDs to their icons
const tabIcons: Record<string, React.ReactNode> = {
    'today': <Calendar className="w-4 h-4" />,
    'new': <Sparkles className="w-4 h-4" />,
    'most-saved': <Bookmark className="w-4 h-4" />,
    'most-used': <CheckCircle2 className="w-4 h-4" />,
    'browser-extension': <Globe className="w-4 h-4" />,
    'apps': <Smartphone className="w-4 h-4" />,
    'discord': <MessageCircle className="w-4 h-4" />,
};

interface FilterTabsProps {
    tabs?: FilterTab[];
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
    syncWithUrl?: boolean;
}

/**
 * Filter Tabs - Single line with drag and wheel scroll
 * 
 * Features:
 * - All tabs in ONE line (no wrapping)
 * - No visible scrollbar
 * - Mouse wheel converts vertical scroll to horizontal
 * - Click and drag to scroll
 */
export function FilterTabs({
    tabs = defaultTabs,
    activeTab: controlledActiveTab,
    onTabChange,
    syncWithUrl = true
}: FilterTabsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const containerRef = useRef<HTMLDivElement>(null);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const urlTab = searchParams.get('filter');
    const activeTab = controlledActiveTab ?? urlTab ?? 'today';

    // Handle wheel scroll - convert vertical to horizontal
    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;

        // Check if there's horizontal overflow
        if (container.scrollWidth > container.clientWidth) {
            e.preventDefault();
            // Use deltaY for vertical wheel, convert to horizontal scroll
            container.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
        }
    }, []);

    // Drag to scroll handlers
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;

        // Don't start drag if clicking on a button
        if ((e.target as HTMLElement).closest('button, a')) return;

        setIsDragging(true);
        setStartX(e.pageX - container.offsetLeft);
        setScrollLeft(container.scrollLeft);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const container = containerRef.current;
        if (!container) return;

        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        container.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Also handle touch events for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;

        setStartX(e.touches[0].pageX - container.offsetLeft);
        setScrollLeft(container.scrollLeft);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;

        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 1.5;
        container.scrollLeft = scrollLeft - walk;
    }, [startX, scrollLeft]);

    const handleTabClick = useCallback((tabId: string) => {
        if (onTabChange) {
            onTabChange(tabId);
        }

        if (syncWithUrl) {
            const params = new URLSearchParams(searchParams.toString());
            if (tabId === 'today') {
                params.delete('filter');
            } else {
                params.set('filter', tabId);
            }
            router.push(`?${params.toString()}`, { scroll: false });
        }
    }, [onTabChange, syncWithUrl, searchParams, router]);

    return (
        <div
            ref={containerRef}
            role="tablist"
            aria-label="Filter tools by category"
            className={cn(
                "flex items-center gap-3 mb-6 overflow-x-auto scrollbar-hide select-none",
                isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const icon = tabIcons[tab.id];

                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`tabpanel-${tab.id}`}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                            'border whitespace-nowrap flex-shrink-0 cursor-pointer',
                            'focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none',
                            isActive
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]'
                        )}
                    >
                        {icon && (
                            <span className={cn(
                                isActive ? 'text-white' : 'text-gray-500',
                                tab.id === 'most-used' && !isActive && 'text-green-500'
                            )}>
                                {icon}
                            </span>
                        )}
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Get filter tab ID from URL search params
 */
export function getFilterFromUrl(searchParams: URLSearchParams): string {
    const filter = searchParams.get('filter');
    if (filter && FILTER_TAB_IDS.includes(filter as typeof FILTER_TAB_IDS[number])) {
        return filter;
    }
    return 'today';
}
