'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

/**
 * Subcategory item
 */
interface Subcategory {
    id: string;
    name: string;
    toolCount: number;
}

/**
 * Category with subcategories
 */
interface CategoryWithSubs {
    id: string;
    name: string;
    slug: string;
    toolCount: number;
    subcategories: Subcategory[];
}

/**
 * Props for MobileCategoryAccordion
 */
export interface MobileCategoryAccordionProps {
    /** Categories with their subcategories */
    categories: CategoryWithSubs[];
    /** Additional CSS classes */
    className?: string;
}

/**
 * Single Accordion Item Component
 */
function AccordionItem({
    category,
    isOpen,
    onToggle
}: {
    category: CategoryWithSubs;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            {/* Accordion Header */}
            <button
                onClick={onToggle}
                className={cn(
                    'w-full flex items-center justify-between gap-3 px-4 py-3',
                    'text-left',
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-500',
                    'transition-colors duration-150'
                )}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${category.id}`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon
                        slug={category.slug}
                        size="sm"
                        className="flex-shrink-0"
                    />
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                        {category.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full flex-shrink-0">
                        {category.toolCount}
                    </span>
                </div>

                <ChevronDown
                    className={cn(
                        'w-5 h-5 text-gray-400 flex-shrink-0',
                        'transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )}
                    aria-hidden="true"
                />
            </button>

            {/* Accordion Content */}
            <div
                id={`accordion-content-${category.id}`}
                className={cn(
                    'overflow-hidden',
                    'transition-all duration-300 ease-out',
                    isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                )}
                aria-hidden={!isOpen}
            >
                <div className="px-4 pb-3 pt-1">
                    {category.subcategories.length > 0 ? (
                        <ul className="space-y-1" role="list">
                            {category.subcategories.map((sub) => (
                                <li key={sub.id}>
                                    <Link
                                        href={`/free-ai-tools/${category.slug}#${sub.id}`}
                                        className={cn(
                                            'flex items-center justify-between px-3 py-2 rounded-lg',
                                            'text-sm text-gray-600 dark:text-gray-300',
                                            'hover:bg-purple-50 dark:hover:bg-purple-900/20',
                                            'hover:text-purple-700 dark:hover:text-purple-300',
                                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
                                            'transition-colors duration-150'
                                        )}
                                    >
                                        <span className="truncate">{sub.name}</span>
                                        <span className="text-xs text-purple-600 dark:text-purple-400 flex-shrink-0">
                                            {sub.toolCount}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                            No subcategories available.
                        </p>
                    )}

                    {/* View All Link */}
                    <Link
                        href={`/free-ai-tools/${category.slug}`}
                        className={cn(
                            'block mt-2 px-3 py-2 rounded-lg',
                            'text-sm font-medium text-purple-600 dark:text-purple-400',
                            'hover:bg-purple-50 dark:hover:bg-purple-900/20',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
                            'transition-colors duration-150'
                        )}
                    >
                        View all {category.name} tools →
                    </Link>
                </div>
            </div>
        </div>
    );
}

/**
 * MobileCategoryAccordion Component
 * 
 * Client component for mobile/tablet category navigation.
 * Shows on screens below lg breakpoint (replaces sidebar).
 * 
 * Features:
 * - Expandable accordion for each category
 * - Smooth height transitions
 * - Subcategory links with tool counts
 * - Proper ARIA attributes
 */
export function MobileCategoryAccordion({
    categories,
    className,
}: MobileCategoryAccordionProps) {
    const [openIds, setOpenIds] = useState<Set<string>>(new Set());

    const handleToggle = useCallback((categoryId: string) => {
        setOpenIds((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    }, []);

    return (
        <div
            className={cn(
                // Visible on mobile/tablet, hidden on desktop
                'lg:hidden',
                'mb-8',
                className
            )}
        >
            <div
                className={cn(
                    'bg-white dark:bg-gray-900',
                    'rounded-xl border border-gray-200 dark:border-gray-700',
                    'overflow-hidden'
                )}
            >
                <h2 className="sr-only">Browse categories</h2>

                {categories.map((category) => (
                    <AccordionItem
                        key={category.id}
                        category={category}
                        isOpen={openIds.has(category.id)}
                        onToggle={() => handleToggle(category.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default MobileCategoryAccordion;
