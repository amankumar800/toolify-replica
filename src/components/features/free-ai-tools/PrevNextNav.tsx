'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Navigation page reference for previous/next navigation
 */
export interface PageRef {
  /** Display name of the page/category */
  name: string;
  /** URL slug for the page/category */
  slug: string;
}

/**
 * Props for PrevNextNav component
 */
export interface PrevNextNavProps {
  /** Previous page reference, null if no previous page */
  previousPage: PageRef | null;
  /** Next page reference, null if no next page */
  nextPage: PageRef | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generates the href for a navigation link
 * Links to /free-ai-tools/[slug] for categories
 * 
 * @param slug - The category slug
 * @returns The full href path
 */
export function getNavHref(slug: string): string {
  return `/free-ai-tools/${slug}`;
}

/**
 * PrevNextNav Component
 * 
 * Previous/Next navigation links displayed at the bottom of Free AI Tools pages.
 * 
 * Features:
 * - Previous/Next navigation links at bottom of pages (Requirement 2.8, 4.5)
 * - Shows "-" (disabled) when previous/next is null (Requirement 2.8)
 * - Links to /free-ai-tools/[slug] for categories (Requirement 14.4)
 * - Displays category names as link text (Requirement 4.5, 14.4)
 * 
 * @param previousPage - Previous page reference or null
 * @param nextPage - Next page reference or null
 * @param className - Additional CSS classes
 */
export function PrevNextNav({
  previousPage,
  nextPage,
  className,
}: PrevNextNavProps) {
  return (
    <nav
      className={cn(
        'flex items-center justify-between py-6 border-t border-[var(--border)]',
        className
      )}
      aria-label="Page navigation"
    >
      {/* Previous Page Link */}
      <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
        <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
          Previous Page
        </span>
        {previousPage ? (
          <Link
            href={getNavHref(previousPage.slug)}
            className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate max-w-full focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 rounded"
          >
            ← {previousPage.name}
          </Link>
        ) : (
          <span 
            className="text-sm text-[var(--muted-foreground)]"
            aria-label="No previous page"
          >
            -
          </span>
        )}
      </div>

      {/* Next Page Link */}
      <div className="flex flex-col items-end gap-1 min-w-0 flex-1">
        <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">
          Next Page
        </span>
        {nextPage ? (
          <Link
            href={getNavHref(nextPage.slug)}
            className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate max-w-full focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 rounded"
          >
            {nextPage.name} →
          </Link>
        ) : (
          <span 
            className="text-sm text-[var(--muted-foreground)]"
            aria-label="No next page"
          >
            -
          </span>
        )}
      </div>
    </nav>
  );
}

export default PrevNextNav;
