'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CategoryGroup } from '@/lib/types/tool';
import { getCategoryIcon } from '@/lib/utils/icon-mapping';
import { useCategoryBrowser } from '@/lib/context/CategoryBrowserContext';
import { ChevronRight } from 'lucide-react';

interface CategorySidebarProps {
    groups: CategoryGroup[];
}

export function CategorySidebar({ groups }: CategorySidebarProps) {
    const { activeSectionId, setActiveSectionId, setIsScrolling } = useCategoryBrowser();

    const handleCategoryClick = (e: React.MouseEvent, categoryId: string) => {
        e.preventDefault();

        // Disable "Spy" logic temporarily
        setIsScrolling(true);
        setActiveSectionId(categoryId);

        // Update URL hash without history push (History.replaceState)
        window.history.replaceState(null, '', `#${categoryId}`);

        // Smooth scroll to target
        const element = document.getElementById(categoryId);
        if (element) {
            const headerOffset = 100; // Adjust based on Fixed Nav height
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Re-enable Spy after animation (approx 1000ms)
            setTimeout(() => {
                setIsScrolling(false);
            }, 1000);
        }
    };

    return (
        <nav className="flex flex-col gap-8 pb-32" aria-label="Category Navigation">
            {groups.map((group, groupIndex) => (
                <div key={`${group.id}-${groupIndex}`} className="flex flex-col gap-2">
                    <h3 className="px-3 text-xs font-semibold tracking-wider text-toolify-gray-400 uppercase mb-1 flex items-center gap-2">
                        {group.name}
                    </h3>

                    <div className="flex flex-col gap-0.5">
                        {group.categories.map((category, catIndex) => {
                            const Icon = getCategoryIcon(category.slug);
                            const isActive = activeSectionId === category.slug;

                            return (
                                <a
                                    key={`${category.id}-${catIndex}`}
                                    href={`#${category.slug}`}
                                    onClick={(e) => handleCategoryClick(e, category.slug)}
                                    className={cn(
                                        "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                        isActive
                                            ? "bg-toolify-purple-50 text-toolify-purple-700 bg-opacity-80"
                                            : "text-toolify-gray-600 hover:bg-gray-100 hover:text-toolify-black"
                                    )}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={cn(
                                            "w-4 h-4 transition-colors",
                                            isActive ? "text-toolify-purple-600" : "text-gray-400 group-hover:text-toolify-purple-500"
                                        )} />
                                        <span>{category.name}</span>
                                    </div>

                                    {/* Optional: Count badge or chevron */}
                                    {isActive && (
                                        <ChevronRight className="w-3.5 h-3.5 text-toolify-purple-500 opacity-100" />
                                    )}
                                </a>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );
}
