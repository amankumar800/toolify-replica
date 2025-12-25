'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CategoryGroup } from '@/lib/types/tool';
import { useCategoryBrowser } from '@/lib/context/CategoryBrowserContext';

interface MobileCategoryNavProps {
    groups: CategoryGroup[];
}

export function MobileCategoryNav({ groups }: MobileCategoryNavProps) {
    const { activeSectionId, setActiveSectionId, setIsScrolling } = useCategoryBrowser();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Flatten logic: We need to show ALL categories or just Groups?
    // AI Tools Book mobile shows categories horizontally.
    const allCategories = React.useMemo(() => {
        return groups.flatMap(g => g.categories);
    }, [groups]);

    const handleClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setIsScrolling(true);
        setActiveSectionId(id);

        window.history.replaceState(null, '', `#${id}`);

        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 180; // Larger offset for mobile (Nav + MobileBar)
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            setTimeout(() => setIsScrolling(false), 1000);
        }
    };

    // Auto-scroll the active chip into view
    useEffect(() => {
        if (activeSectionId && scrollContainerRef.current) {
            const activeEl = document.getElementById(`nav-chip-${activeSectionId}`);
            if (activeEl) {
                activeEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [activeSectionId]);

    return (
        <div className="lg:hidden sticky top-[64px] z-mobile-nav bg-toolify-white/95 backdrop-blur-sm border-b border-gray-100">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto no-scrollbar py-3 px-4 gap-2 scroll-smooth"
            >
                {allCategories.map((cat, index) => {
                    const isActive = activeSectionId === cat.slug;
                    return (
                        <button
                            key={`${cat.id}-${index}`}
                            id={`nav-chip-${cat.slug}`}
                            onClick={(e) => handleClick(e, cat.slug)}
                            className={cn(
                                "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                isActive
                                    ? "bg-toolify-black text-white shadow-md scale-105"
                                    : "bg-white text-toolify-gray-600 border border-gray-200 hover:border-gray-300"
                            )}
                        >
                            {cat.name}
                        </button>
                    );
                })}
            </div>
            {/* Fade Gradients */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
    );
}
