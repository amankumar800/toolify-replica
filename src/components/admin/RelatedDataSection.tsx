'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface RelatedDataItem {
  id: string;
  label: string;
  href?: string;
  sublabel?: string;
}

export interface RelatedDataSectionProps {
  /** Section title */
  title: string;
  /** Items to display */
  items: RelatedDataItem[];
  /** Total count of items (for "View All" link) */
  totalCount?: number;
  /** Link to view all items */
  viewAllHref?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Message when no items */
  emptyMessage?: string;
  /** Maximum items to display (default: 10) */
  maxItems?: number;
  /** Whether section is expanded by default */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * RelatedDataSection Component
 * 
 * Displays related data in a collapsible section below forms.
 * Shows a limited number of items with a "View All" link when there are more.
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6
 */
export function RelatedDataSection({
  title,
  items,
  totalCount,
  viewAllHref,
  isLoading = false,
  emptyMessage = 'No related items found',
  maxItems = 10,
  defaultExpanded = true,
  className,
}: RelatedDataSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const displayedItems = items.slice(0, maxItems);
  const actualTotalCount = totalCount ?? items.length;
  const hasMore = actualTotalCount > maxItems;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header - Collapsible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 sm:px-6 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {isLoading ? '...' : actualTotalCount}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 py-3 sm:px-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : displayedItems.length === 0 ? (
            <p className="text-sm text-gray-500 italic">{emptyMessage}</p>
          ) : (
            <>
              <ul className="space-y-2">
                {displayedItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-900 truncate block">
                          {item.label}
                        </span>
                      )}
                      {item.sublabel && (
                        <span className="text-xs text-gray-500 truncate block">
                          {item.sublabel}
                        </span>
                      )}
                    </div>
                    {item.href && (
                      <Link
                        href={item.href}
                        className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        title="Open"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              {/* View All Link */}
              {hasMore && viewAllHref && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Link
                    href={viewAllHref}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                  >
                    View all {actualTotalCount} items
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for the related data section
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

RelatedDataSection.displayName = 'RelatedDataSection';
