'use client';

import React, { useMemo } from 'react';
import { CategoryGroup, Tool } from '@/lib/types/tool';
import { CategorySection } from '@/components/features/category/CategorySection';
import { useCategoryBrowser } from '@/lib/context/CategoryBrowserContext';
import { AdPlaceholder } from '@/components/ui/AdPlaceholder';

interface CategoryMainListProps {
    groups: CategoryGroup[];
    allTools: Tool[];
}

export function CategoryMainList({ groups, allTools }: CategoryMainListProps) {
    const { searchQuery, sortBy } = useCategoryBrowser();

    // Memoize the filtered and sorted tools to prevent expensive re-calculations
    const processedTools = useMemo(() => {
        let tools = [...allTools];

        // 1. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            tools = tools.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.shortDescription.toLowerCase().includes(q) ||
                t.categories.some(c => c.toLowerCase().includes(q))
            );
        }

        // 2. Sort Logic
        if (sortBy === 'newest') {
            tools.sort((a, b) => {
                const dateA = new Date(a.dateAdded || 0).getTime();
                const dateB = new Date(b.dateAdded || 0).getTime();
                return dateB - dateA;
            });
        } else {
            // Default to Popular
            tools.sort((a, b) => b.savedCount - a.savedCount);
        }

        return tools;
    }, [allTools, searchQuery, sortBy]);

    // Check if we have any results at all
    if (processedTools.length === 0) {
        return (
            <div className="py-20 text-center text-toolify-gray-500">
                <p className="text-lg font-medium">No tools found matching "{searchQuery}"</p>
                <p className="text-sm mt-2">Try adjusting your search terms</p>
            </div>
        );
    }

    return (
        <div className="space-y-16">
            {groups.map((group, index) => {
                const visibleCategories = group.categories.map(category => {
                    const categoryTools = processedTools.filter(t =>
                        t.categories.includes(category.name) ||
                        t.categories.includes(category.id) ||
                        t.categories.some(c => c.toLowerCase() === category.name.toLowerCase())
                    );
                    return { category, tools: categoryTools };
                }).filter(item => item.tools.length > 0);

                if (visibleCategories.length === 0) return null;

                return (
                    <React.Fragment key={group.id}>
                        <div className="space-y-12 animate-in fade-in duration-500 slide-in-from-bottom-4">
                            {visibleCategories.map(({ category, tools }) => (
                                <CategorySection
                                    key={category.id}
                                    category={{ ...category, toolCount: tools.length }}
                                    tools={tools}
                                />
                            ))}
                        </div>
                        {/* Inject Ad after 3rd group */}
                        {(index === 2 && !searchQuery) && <AdPlaceholder />}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
