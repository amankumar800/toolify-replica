'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Props for SubcategoryCard component
 */
export interface SubcategoryCardProps {
    /** Subcategory name */
    name: string;
    /** Number of tools in this subcategory */
    toolCount: number;
    /** Parent category slug for the link */
    categorySlug: string;
    /** Subcategory slug/id for anchor linking */
    subcategoryId?: string;
    /** Additional CSS classes */
    className?: string;
}

/**
 * SubcategoryCard Component
 * 
 * Premium card component for displaying subcategories with tool counts.
 * Features smooth hover animations and proper accessibility support.
 * 
 * Design specs:
 * - translateY(-2px) on hover (less layout thrash than scale)
 * - 200ms cubic-bezier(0.4, 0, 0.2, 1) timing
 * - Purple accent on hover state
 * - Focus-visible ring for keyboard nav
 */
export function SubcategoryCard({
    name,
    toolCount,
    categorySlug,
    subcategoryId,
    className,
}: SubcategoryCardProps) {
    // Build the href - links to category page with optional anchor
    const href = subcategoryId
        ? `/free-ai-tools/${categorySlug}#${subcategoryId}`
        : `/free-ai-tools/${categorySlug}`;

    return (
        <Link
            href={href}
            className={cn(
                // Base styles
                'group block p-4 rounded-xl',
                'bg-white dark:bg-gray-900',
                'border border-gray-200 dark:border-gray-700',

                // Hover effects - using translateY for performance
                'hover:-translate-y-0.5',
                'hover:shadow-lg hover:shadow-purple-500/10',
                'hover:border-purple-400 dark:hover:border-purple-500',

                // Transition timing
                'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',

                // Focus states for keyboard navigation
                'focus:outline-none',
                'focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-offset-gray-900',

                // Reduced motion support
                'motion-reduce:transform-none motion-reduce:transition-none',

                className
            )}
        >
            <div className="flex items-center justify-between gap-3">
                {/* Subcategory name */}
                <span
                    className={cn(
                        'font-medium text-gray-900 dark:text-white',
                        'group-hover:text-purple-600 dark:group-hover:text-purple-400',
                        'transition-colors duration-150',
                        'truncate'
                    )}
                >
                    {name}
                </span>

                {/* Tool count badge */}
                <span
                    className={cn(
                        'flex-shrink-0',
                        'text-sm font-medium',
                        'text-purple-600 dark:text-purple-400',
                        'bg-purple-50 dark:bg-purple-900/30',
                        'px-2.5 py-0.5 rounded-full',
                        'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50',
                        'transition-colors duration-150'
                    )}
                    aria-label={`${toolCount} tools`}
                >
                    {toolCount.toLocaleString()}
                </span>
            </div>
        </Link>
    );
}

export default SubcategoryCard;
