'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AdBanner } from './AdBanner';
import type { CategoryListItem } from '@/lib/types/free-ai-tools';

/**
 * Props for MobileDrawer component
 */
export interface MobileDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** List of categories to display */
  categories: CategoryListItem[];
  /** Currently active category slug */
  activeSlug?: string;
}

/**
 * Icon mapping for free AI tools categories
 * Maps category slugs to emoji icons
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
 * Helper function to determine body overflow style based on drawer state.
 * Exported for property-based testing.
 * 
 * Property 11: Mobile Drawer Body Scroll Prevention
 * For any state where the mobile drawer is open, the body element SHALL have
 * scroll disabled (overflow: hidden) to prevent background scrolling.
 * 
 * @param isOpen - Whether the drawer is open
 * @returns 'hidden' if drawer is open, '' (empty string) if closed
 */
export function getBodyOverflowStyle(isOpen: boolean): string {
  return isOpen ? 'hidden' : '';
}

/**
 * Selector for focusable elements within the drawer
 */
const FOCUSABLE_SELECTOR = 
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * MobileDrawer Component
 * 
 * Mobile navigation drawer for Free AI Tools categories.
 * Slides out from the left side on mobile devices.
 * 
 * Features:
 * - Slide-out drawer from left (transform: translateX) - Requirement 19.2
 * - 300ms ease-in-out transition
 * - Close button (X icon) and backdrop overlay - Requirement 19.3
 * - Body scroll prevention when open - Requirement 19.5
 * - Focus trap for accessibility - Requirement 16.7
 * - Auto-close on category selection - Requirement 19.4
 * 
 * @param isOpen - Whether the drawer is open
 * @param onClose - Callback to close the drawer
 * @param categories - List of categories to display
 * @param activeSlug - Currently active category slug
 */
export function MobileDrawer({
  isOpen,
  onClose,
  categories,
  activeSlug,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Determine active slug from pathname if not provided
  const currentActiveSlug = activeSlug ?? pathname.split('/').pop();
  const isIntroductionActive = pathname === '/free-ai-tools';

  /**
   * Handle category link click - auto-close drawer (Requirement 19.4)
   */
  const handleCategoryClick = useCallback(() => {
    onClose();
  }, [onClose]);

  /**
   * Body scroll prevention (Requirement 19.5)
   */
  useEffect(() => {
    const overflow = getBodyOverflowStyle(isOpen);
    document.body.style.overflow = overflow;

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /**
   * Focus trap implementation (Requirement 16.7)
   * - Captures focus when drawer opens
   * - Traps Tab key navigation within the drawer
   * - Handles Escape key to close
   * - Returns focus to trigger element when closed
   */
  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the first focusable element (close button)
    const drawer = drawerRef.current;
    if (drawer) {
      const focusableElements = drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    /**
     * Handle keydown events for focus trap and escape
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close on Escape
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap on Tab
      if (event.key === 'Tab' && drawer) {
        const focusableElements = drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: if on first element, move to last
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: if on last element, move to first
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the previously focused element
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop overlay - Requirement 19.3 */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black transition-opacity duration-300 ease-in-out',
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel - Requirement 19.2 */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Category navigation"
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header with close button - Requirement 19.3 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Navigation
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
            )}
            aria-label="Close navigation menu"
          >
            {/* X icon */}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="overflow-y-auto h-[calc(100%-65px)] p-4">
          <div className="flex flex-col gap-4">
            {/* AD Banner - Requirement 3.7 */}
            <AdBanner />

            {/* Introduction Link - Requirement 3.1 */}
            <Link
              href="/free-ai-tools"
              onClick={handleCategoryClick}
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
              <h3 className="px-3 text-sm font-semibold text-[var(--foreground)]">
                Free AI Tools
              </h3>

              {/* Category Navigation */}
              <nav className="flex flex-col gap-0.5" role="navigation">
                {categories.map((category) => {
                  const href = `/free-ai-tools/${category.slug}`;
                  const isActive = currentActiveSlug === category.slug;
                  const icon = getCategoryIcon(category.slug);

                  return (
                    <Link
                      key={category.id}
                      href={href}
                      onClick={handleCategoryClick}
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
      </div>
    </>
  );
}

export default MobileDrawer;
