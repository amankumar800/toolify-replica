'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Tool } from '@/lib/types/free-ai-tools';

/**
 * Maximum description length before truncation
 * Per Requirement 5.7: Truncate descriptions > 200 characters
 */
const MAX_DESCRIPTION_LENGTH = 200;

/**
 * Fallback values for missing/incomplete tool data
 * Per Requirement 5.5: Display fallback state showing available data without breaking UI
 */
const FALLBACK_TOOL_NAME = 'Unknown Tool';
const FALLBACK_DESCRIPTION = 'No description available';

interface FreeAIToolListItemProps {
  tool: Tool;
  className?: string;
}

/**
 * Adds UTM parameter to external URL
 * Per Requirement 14.2: External links include utm_source=toolify parameter
 */
export function addUtmParameter(url: string): string {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('utm_source', 'toolify');
    return urlObj.toString();
  } catch {
    // If URL parsing fails, append manually
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=toolify`;
  }
}

/**
 * Truncates description to specified length with ellipsis
 * Per Requirement 5.7: Truncate descriptions > 200 characters with ellipsis
 */
export function truncateDescription(description: string, maxLength: number = MAX_DESCRIPTION_LENGTH): string {
  if (!description || description.length <= maxLength) {
    return description;
  }
  
  // Find the last space before maxLength to avoid cutting words
  const truncated = description.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
}

/**
 * Formats tool description with free tier details and pricing
 * Per Requirements 5.3, 5.4: Display description with free tier and pricing
 * Per Requirement 5.5: Handle missing/incomplete data gracefully
 */
export function formatToolDescription(tool: Partial<Tool>): string {
  const parts: string[] = [];
  
  if (tool.freeTierDetails) {
    parts.push(tool.freeTierDetails);
  }
  
  if (tool.description) {
    // Avoid duplicating freeTierDetails if already in description
    if (!tool.freeTierDetails || !tool.description.includes(tool.freeTierDetails)) {
      parts.push(tool.description);
    }
  }
  
  if (tool.pricing) {
    // Avoid duplicating pricing if already in description
    if (!tool.description?.includes(tool.pricing)) {
      parts.push(tool.pricing);
    }
  }
  
  return parts.join(' - ');
}

/**
 * Checks if tool data is valid and complete enough to display
 * Per Requirement 5.5: Handle missing/incomplete tool data
 */
export function isValidToolData(tool: Partial<Tool> | null | undefined): tool is Tool {
  if (!tool) return false;
  // At minimum, we need an id and slug to render the tool
  return typeof tool.id === 'string' && typeof tool.slug === 'string';
}

/**
 * Gets safe tool name with fallback
 * Per Requirement 5.5: Display fallback for missing data
 */
export function getSafeToolName(tool: Partial<Tool>): string {
  return tool.name?.trim() || FALLBACK_TOOL_NAME;
}

/**
 * Gets safe tool description with fallback
 * Per Requirement 5.5: Display fallback for missing data
 */
export function getSafeToolDescription(tool: Partial<Tool>): string {
  const formatted = formatToolDescription(tool);
  return formatted.trim() || FALLBACK_DESCRIPTION;
}

/**
 * Validates tool slug format
 * Per Requirement 13.5: slug max 100 chars, alphanumeric with hyphens only
 */
export function isValidToolSlug(slug: string): boolean {
  if (!slug || slug.length > 100) {
    return false;
  }
  return /^[a-z0-9-]+$/.test(slug);
}

/**
 * External Link Icon Component
 */
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/**
 * FreeAIToolListItem Component
 * 
 * Displays an individual tool as a list item on category pages.
 * Per Requirements 5.1-5.7, 14.1, 14.2
 * 
 * Features:
 * - Rendered as `<li>` element within `<ul>` list
 * - Tool name as internal link to /tool/[slug]
 * - External link icon opening in new tab with rel="noopener noreferrer"
 * - External URL includes utm_source=toolify parameter
 * - Description with free tier details and pricing
 * - Truncate descriptions > 200 characters with expand/collapse
 * - Fallback states for missing/incomplete data (Requirement 5.5)
 */
export function FreeAIToolListItem({ tool, className }: FreeAIToolListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Per Requirement 5.5: Handle missing/incomplete tool data gracefully
  if (!isValidToolData(tool)) {
    return null; // Don't render invalid tools
  }
  
  const toolName = getSafeToolName(tool);
  const fullDescription = getSafeToolDescription(tool);
  const shouldTruncate = fullDescription.length > MAX_DESCRIPTION_LENGTH;
  const displayDescription = isExpanded ? fullDescription : truncateDescription(fullDescription);
  
  // Per Requirement 5.6: Hide external link icon when no external URL
  const externalUrl = tool.externalUrl ? addUtmParameter(tool.externalUrl) : null;

  return (
    <li
      className={cn(
        'py-3 border-b border-[var(--border)] last:border-b-0',
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        {/* Tool Name and Links */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Internal Link - Tool Name */}
          <Link
            href={`/tool/${tool.slug}`}
            className={cn(
              'font-medium text-[var(--foreground)]',
              'hover:text-[var(--primary)] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 rounded'
            )}
          >
            {toolName}
          </Link>
          
          {/* External Link Icon - Per Requirement 5.6: Hide if no external URL */}
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'text-[var(--muted-foreground)] hover:text-[var(--primary)]',
                'transition-colors inline-flex items-center',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 rounded'
              )}
              aria-label={`Visit ${toolName} website (opens in new tab)`}
            >
              <ExternalLinkIcon />
            </a>
          )}
        </div>
        
        {/* Description with Free Tier and Pricing */}
        {displayDescription && (
          <div className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            <span>{displayDescription}</span>
            
            {/* Expand/Collapse Button - Per Requirement 5.7 */}
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'ml-1 text-[var(--primary)] hover:underline',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 rounded',
                  'text-sm font-medium'
                )}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Show less' : 'Show more'}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default FreeAIToolListItem;
