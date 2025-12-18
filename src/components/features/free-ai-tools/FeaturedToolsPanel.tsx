'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { FeaturedTool } from '@/lib/types/free-ai-tools';

interface FeaturedToolsPanelProps {
  tools: FeaturedTool[];
  className?: string;
}

/**
 * Get badge styling based on badge type
 * Returns appropriate color classes for Free, New, or Popular badges
 */
export function getBadgeStyles(badge: FeaturedTool['badge']): string {
  switch (badge) {
    case 'Free':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'New':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Popular':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return '';
  }
}

/**
 * FeaturedToolsPanel Component
 * 
 * Displays featured/sponsored tools on the main Free AI Tools page.
 * Per Requirement 2.7: Display Featured_Tools_Panel on the right side with tool cards
 * Per Requirement 13.6: FeaturedTool with optional badge ("Free", "New", "Popular")
 * 
 * Features:
 * - "Featured*" heading (asterisk indicates sponsored content)
 * - Tool cards with image, name, description
 * - Optional badges: "Free", "New", or "Popular"
 * - Clickable cards linking to /tool/[slug]
 */
export function FeaturedToolsPanel({ tools, className }: FeaturedToolsPanelProps) {
  // Sort tools by displayOrder
  const sortedTools = [...tools].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <aside
      className={cn('flex flex-col gap-4', className)}
      aria-label="Featured AI Tools"
    >
      {/* Heading with asterisk indicating sponsored */}
      <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-baseline gap-1">
        Featured
        <span className="text-[var(--muted-foreground)] text-xs" title="Sponsored content">*</span>
      </h3>

      {/* Tool Cards */}
      <div className="flex flex-col gap-3">
        {sortedTools.map((tool) => (
          <FeaturedToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {/* Sponsored disclaimer */}
      <p className="text-[10px] text-[var(--muted-foreground)]">
        * Sponsored content
      </p>
    </aside>
  );
}

interface FeaturedToolCardProps {
  tool: FeaturedTool;
}

/**
 * Individual featured tool card component
 */
function FeaturedToolCard({ tool }: FeaturedToolCardProps) {
  const [imageError, setImageError] = React.useState(false);

  return (
    <Link
      href={`/tool/${tool.slug}`}
      className={cn(
        'group flex gap-3 p-3 rounded-lg border border-[var(--border)]',
        'bg-white hover:bg-[var(--muted)]/50 hover:border-[var(--primary)]/30',
        'transition-all duration-200 cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2'
      )}
      aria-label={`View ${tool.name} details`}
    >
      {/* Tool Image */}
      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-[var(--muted)] flex-shrink-0">
        {!imageError ? (
          <Image
            src={tool.imageUrl}
            alt={`${tool.name} icon`}
            width={48}
            height={48}
            className="object-cover w-full h-full"
            onError={() => setImageError(true)}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]"
            role="img"
            aria-label={`${tool.name} icon placeholder`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Tool Info */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {/* Name and Badge */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
            {tool.name}
          </span>
          {tool.badge && (
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                getBadgeStyles(tool.badge)
              )}
            >
              {tool.badge}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>
    </Link>
  );
}

export default FeaturedToolsPanel;
