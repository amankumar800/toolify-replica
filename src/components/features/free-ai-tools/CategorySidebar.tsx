'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AdBanner } from './AdBanner';
import type { CategoryListItem } from '@/lib/types/free-ai-tools';

/**
 * Props for CategorySidebar component
 */
interface CategorySidebarProps {
  /** List of categories to display */
  categories: CategoryListItem[];
  /** Currently active category slug (optional, will be derived from pathname if not provided) */
  activeSlug?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Icon mapping for free AI tools categories
 * Maps category slugs to icon paths or uses a default icon
 */
const CATEGORY_ICONS: Record<string, string> = {
  'chatbots-virtual-companions': '💬',
  'office-productivity': '📊',
  'image-generation-editing': '🖼️',
  'art-creative-design': '🎨',
  'coding-development': '💻',
  'video-animation': '🎬',
  'education-translation': '📚',
  'writing-editing': '✍️',
  'voice-generation-conversion': '🎤',
  'business-management': '💼',
  'music-audio': '🎵',
  'ai-detection-anti-detection': '🔍',
  'marketing-advertising': '📢',
  'research-data-analysis': '📈',
  'social-media': '📱',
  'legal-finance': '⚖️',
  'daily-life': '🏠',
  'health-wellness': '❤️',
  'image-analysis': '👁️',
  'interior-architectural-design': '🏛️',
  'business-research': '🔬',
  'other-1': '📦',
};

/**
 * Get icon for a category by slug
 */
function getCategoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] || '📦';
}


/**
 * Determines if a navigation link should be active based on current pathname
 * Property 1: Navigation Active State Detection
 * For any URL path starting with /free-ai-tools, the navigation component
 * SHALL apply the active state class to the "Free AI Tools" nav link.
 */
export function isActiveLink(pathname: string, href: string): boolean {
  // Exact match
  if (pathname === href) {
    return true;
  }
  // For category pages, check if the pathname matches the category href
  if (href !== '/free-ai-tools' && pathname.startsWith(href)) {
    return true;
  }
  return false;
}

/**
 * CategorySidebar Component
 * 
 * Left navigation panel displaying all 22 free AI tool categories with icons.
 * 
 * Features:
 * - AD Banner at top with avatar, name, description, CTA (Requirement 3.7)
 * - "Introduction" link to /free-ai-tools (Requirement 3.1)
 * - "Free AI Tools" heading with 22 category links (Requirement 3.2)
 * - Icons (20x20px) and tool counts next to each category (Requirement 3.3, 3.8)
 * - Active state highlighting (Requirement 3.5)
 * - Hidden on mobile (< 768px) (Requirement 3.6)
 * 
 * @param categories - List of categories to display
 * @param activeSlug - Currently active category slug
 * @param className - Additional CSS classes
 */
export function CategorySidebar({ 
  categories, 
  activeSlug,
  className 
}: CategorySidebarProps) {
  const pathname = usePathname();
  
  // Determine active slug from pathname if not provided
  const currentActiveSlug = activeSlug ?? pathname.split('/').pop();
  const isIntroductionActive = pathname === '/free-ai-tools';

  return (
    <aside
      className={cn(
        // Hidden on mobile, visible on desktop (md = 768px)
        'hidden md:block',
        // Width and positioning
        'w-60 flex-shrink-0',
        className
      )}
      aria-label="Free AI Tools categories"
    >
      <div className="sticky top-[calc(var(--header-height)+1rem)] max-h-[calc(100vh-var(--header-height)-2rem)] overflow-y-auto">
        <div className="flex flex-col gap-4 pr-4">
          {/* AD Banner - Requirement 3.7 */}
          <AdBanner />

          {/* Introduction Link - Requirement 3.1 */}
          <Link
            href="/free-ai-tools"
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              'focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2',
              isIntroductionActive
                ? 'bg-purple-50 text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:bg-gray-50 hover:text-[var(--foreground)]'
            )}
            aria-current={isIntroductionActive ? 'page' : undefined}
          >
            <span className="w-5 h-5 flex items-center justify-center text-base">📖</span>
            <span>Introduction</span>
          </Link>

          {/* Free AI Tools Section - Requirement 3.2 */}
          <div className="flex flex-col gap-2">
            <h2 className="px-3 text-sm font-semibold text-[var(--foreground)]">
              Free AI Tools
            </h2>

            {/* Category Navigation - Requirements 3.3, 3.4, 3.5, 3.8 */}
            <nav className="flex flex-col gap-0.5" role="navigation">
              {categories.map((category) => {
                const href = `/free-ai-tools/${category.slug}`;
                const isActive = isActiveLink(pathname, href) || currentActiveSlug === category.slug;
                const icon = getCategoryIcon(category.slug);

                return (
                  <Link
                    key={category.id}
                    href={href}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-200',
                      'focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2',
                      isActive
                        ? 'bg-purple-50 text-[var(--primary)] font-medium'
                        : 'text-[var(--muted-foreground)] hover:bg-gray-50 hover:text-[var(--foreground)]'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icon - 20x20px per Requirement 3.3 */}
                      <span 
                        className="w-5 h-5 flex items-center justify-center text-base flex-shrink-0"
                        aria-hidden="true"
                      >
                        {icon}
                      </span>
                      {/* Category Name */}
                      <span className="truncate">{category.name}</span>
                    </div>

                    {/* Tool Count - Requirement 3.8 */}
                    {category.toolCount > 0 && (
                      <span 
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2',
                          isActive
                            ? 'bg-purple-100 text-[var(--primary)]'
                            : 'bg-gray-100 text-[var(--muted-foreground)]'
                        )}
                        aria-label={`${category.toolCount} tools`}
                      >
                        {category.toolCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default CategorySidebar;
