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
                // Base
                'group block p-4 rounded-xl',
                'bg-white/90 dark:bg-gray-900/90',
                'border border-gray-200/80 dark:border-gray-700/80',

                // Premium hover
                'category-card-premium',
                'hover:bg-white dark:hover:bg-gray-900',
                'hover:border-purple-300 dark:hover:border-purple-600',

                // Focus
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
                'dark:focus-visible:ring-offset-gray-900',

                // Motion
                'motion-reduce:transform-none',

                className
            )}
        >
            <div className="flex items-center justify-between gap-3">
                {/* Name */}
                <span className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 truncate">
                    {name}
                </span>

                {/* Badge + Arrow */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/40 px-2.5 py-0.5 rounded-full group-hover:bg-purple-100 dark:group-hover:bg-purple-800/50 transition-colors">
                        {toolCount.toLocaleString()}
                    </span>
                    <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all duration-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    );
}

export default SubcategoryCard;
