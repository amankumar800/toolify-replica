'use client';

import Link from 'next/link';
import { CategoryGroup } from '@/lib/types/tool';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface CategorySidebarProps {
    groups: CategoryGroup[];
}

export function CategorySidebar({ groups }: CategorySidebarProps) {
    // Generate selectors for scroll spy
    const selectors = groups.map(g => `#${g.id}`);
    const activeId = useScrollSpy(selectors, { rootMargin: '-10% 0px -80% 0px' });
    const [isMobile, setIsMobile] = useState(false);

    // Initial check for mobile to prevent hydration mismatch if possible, 
    // but pure CSS is better for layout. 
    // We will use CSS classes `hidden md:block` etc.

    return (
        <>
            {/* Desktop Sidebar - Sticky Left */}
            <aside className="hidden md:block w-64 shrink-0">
                <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4 thin-scrollbar">
                    <h3 className="font-semibold text-gray-900 mb-4 px-2">Categories</h3>
                    <nav className="flex flex-col space-y-1">
                        {groups.map((group) => {
                            const isActive = activeId === group.id;
                            return (
                                <a
                                    key={group.id}
                                    href={`#${group.id}`}
                                    className={cn(
                                        "px-2 py-1.5 text-sm rounded-md transition-colors block",
                                        isActive
                                            ? "font-semibold text-blue-600 bg-blue-50"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document.getElementById(group.id)?.scrollIntoView({
                                            behavior: 'smooth'
                                        });
                                    }}
                                >
                                    {group.name}
                                </a>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Mobile Top Nav - Sticky Top */}
            <div className="md:hidden sticky top-[60px] z-30 bg-white border-b border-gray-200 -mx-4 px-4 py-2 mb-6 overflow-x-auto no-scrollbar">
                <div className="flex space-x-2">
                    {groups.map((group) => {
                        const isActive = activeId === group.id;
                        return (
                            <a
                                key={group.id}
                                href={`#${group.id}`}
                                className={cn(
                                    "whitespace-nowrap px-4 py-1.5 text-sm rounded-full border transition-colors",
                                    isActive
                                        ? "border-blue-200 bg-blue-50 text-blue-700 font-medium"
                                        : "border-gray-200 text-gray-600 bg-white"
                                )}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const el = document.getElementById(group.id);
                                    if (el) {
                                        // Mobile scroll offset calculation
                                        const y = el.getBoundingClientRect().top + window.scrollY - 120;
                                        window.scrollTo({ top: y, behavior: 'smooth' });
                                    }
                                }}
                            >
                                {group.name}
                            </a>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
