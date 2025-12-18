'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Subcategory } from '@/lib/types/free-ai-tools';
import { getSubcategorySectionId } from '@/lib/utils/free-ai-tools-utils';

// Re-export for backwards compatibility
export { getSubcategorySectionId };

/**
 * Props for OnThisPageNav component
 */
interface OnThisPageNavProps {
  /** List of subcategories to display as navigation links */
  subcategories: Subcategory[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Pure function to calculate the active section based on section positions
 * 
 * Implements Property 8: Scroll Spy Section Highlighting
 * For any scroll position on a category page, exactly one subcategory
 * in the On This Page Nav SHALL be highlighted.
 * 
 * @param sections - Array of section objects with id and top position
 * @param threshold - Pixel offset from top of viewport (default: 100px per Requirement 11.4)
 * @returns The ID of the currently active section, or empty string if no sections
 */
export function calculateActiveSectionFromPositions(
  sections: Array<{ id: string; top: number }>,
  threshold: number = 100
): string {
  if (sections.length === 0) return '';

  // Find the section that is currently "active"
  // A section is active if its top is at or above the threshold
  // We want the last section that meets this criteria (closest to threshold from above)
  let activeSection = sections[0].id; // Default to first section

  for (const section of sections) {
    if (section.top <= threshold) {
      activeSection = section.id;
    } else {
      // Once we find a section below threshold, stop
      // The previous section is the active one
      break;
    }
  }

  return activeSection;
}

/**
 * Custom hook for scroll spy with debouncing
 * 
 * Implements Property 8: Scroll Spy Section Highlighting
 * For any scroll position on a category page, exactly one subcategory
 * in the On This Page Nav SHALL be highlighted.
 * 
 * @param ids - Array of section IDs to monitor
 * @param threshold - Pixel offset from top of viewport (default: 100px per Requirement 11.4)
 * @param debounceMs - Debounce delay in milliseconds (default: 150ms)
 * @returns The ID of the currently active section
 */
export function useScrollSpyDebounced(
  ids: string[],
  threshold: number = 100,
  debounceMs: number = 150
): string {
  const [activeId, setActiveId] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateActiveSection = useCallback(() => {
    if (ids.length === 0) return '';

    // Get all section elements and their positions
    const sections = ids
      .map((id) => {
        const element = document.getElementById(id);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { id, top: rect.top };
      })
      .filter((section): section is { id: string; top: number } => section !== null);

    return calculateActiveSectionFromPositions(sections, threshold);
  }, [ids, threshold]);

  useEffect(() => {
    // Skip on server-side
    if (typeof window === 'undefined') return;

    // Set initial active section
    const initialActive = calculateActiveSection();
    if (initialActive) {
      setActiveId(initialActive);
    }

    const handleScroll = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce the calculation
      timeoutRef.current = setTimeout(() => {
        const newActiveId = calculateActiveSection();
        setActiveId(newActiveId);
      }, debounceMs);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [calculateActiveSection, debounceMs]);

  return activeId;
}

/**
 * Smooth scroll to a section with offset
 * Requirement 11.3: Smooth scroll with 80px offset for sticky header
 * 
 * @param id - The ID of the section to scroll to
 * @param offset - Pixel offset from top (default: 80px)
 */
export function scrollToSection(id: string, offset: number = 80): void {
  const element = document.getElementById(id);
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

/**
 * OnThisPageNav Component
 * 
 * Sticky navigation showing subcategory sections for quick jumping.
 * 
 * Features:
 * - "On this page" heading with subcategory links (Requirement 11.1)
 * - Tool counts in parentheses (Requirement 11.2)
 * - Smooth scroll with 80px offset (Requirement 11.3)
 * - Scroll spy with 100px threshold and 150ms debounce (Requirement 11.4)
 * - Sticky positioning (top: 100px) on desktop (Requirement 11.5)
 * - Floating dropdown on mobile (Requirement 11.6)
 * 
 * @param subcategories - List of subcategories to display
 * @param className - Additional CSS classes
 */
export function OnThisPageNav({ subcategories, className }: OnThisPageNavProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate section IDs for scroll spy
  const sectionIds = subcategories.map(getSubcategorySectionId);
  
  // Use scroll spy with debouncing
  const activeId = useScrollSpyDebounced(sectionIds, 100, 150);

  // Handle click on subcategory link
  const handleLinkClick = (id: string) => {
    scrollToSection(id, 80);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isDropdownOpen]);

  if (subcategories.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop: Sticky Sidebar - Requirement 11.5 */}
      <aside
        className={cn(
          // Hidden on mobile, visible on desktop (lg = 1024px)
          'hidden lg:block',
          // Width and positioning
          'w-56 flex-shrink-0',
          className
        )}
        aria-label="On this page navigation"
      >
        <div className="sticky top-[100px]">
          <nav className="flex flex-col gap-2">
            {/* Heading - Requirement 11.1 */}
            <h3 className="text-sm font-semibold text-[var(--foreground)] px-3">
              On this page
            </h3>

            {/* Subcategory Links - Requirement 11.2 */}
            <ul className="flex flex-col gap-0.5" role="list">
              {subcategories.map((subcategory) => {
                const sectionId = getSubcategorySectionId(subcategory);
                const isActive = activeId === sectionId;

                return (
                  <li key={subcategory.id}>
                    <button
                      onClick={() => handleLinkClick(sectionId)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-sm rounded-md transition-all duration-200',
                        'hover:bg-gray-50 hover:text-[var(--foreground)]',
                        'focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2',
                        isActive
                          ? 'text-[var(--primary)] font-medium bg-purple-50'
                          : 'text-[var(--muted-foreground)]'
                      )}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      {/* Subcategory name with tool count - Requirement 11.2 */}
                      {subcategory.name} ({subcategory.toolCount})
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>


      {/* Mobile: Floating Dropdown Button - Requirement 11.6 */}
      <div
        ref={dropdownRef}
        className={cn(
          // Visible on mobile, hidden on desktop
          'lg:hidden',
          // Fixed positioning in bottom-right
          'fixed bottom-24 right-6 z-40'
        )}
      >
        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div
            className={cn(
              'absolute bottom-full right-0 mb-2',
              'w-64 max-h-80 overflow-y-auto',
              'bg-white rounded-lg shadow-lg border border-[var(--border)]',
              'animate-in fade-in slide-in-from-bottom-2 duration-200'
            )}
            role="menu"
            aria-label="On this page navigation"
          >
            <div className="p-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)] px-3 py-2">
                On this page
              </h3>
              <ul className="flex flex-col gap-0.5" role="list">
                {subcategories.map((subcategory) => {
                  const sectionId = getSubcategorySectionId(subcategory);
                  const isActive = activeId === sectionId;

                  return (
                    <li key={subcategory.id}>
                      <button
                        onClick={() => handleLinkClick(sectionId)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200',
                          'hover:bg-gray-50 hover:text-[var(--foreground)]',
                          'focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2',
                          isActive
                            ? 'text-[var(--primary)] font-medium bg-purple-50'
                            : 'text-[var(--muted-foreground)]'
                        )}
                        role="menuitem"
                        aria-current={isActive ? 'true' : undefined}
                      >
                        {subcategory.name} ({subcategory.toolCount})
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            'flex items-center justify-center',
            'w-12 h-12 rounded-full',
            'bg-[var(--primary)] text-white',
            'shadow-lg hover:shadow-xl',
            'transition-all duration-200',
            'hover:scale-105 active:scale-95'
          )}
          aria-expanded={isDropdownOpen}
          aria-controls="on-this-page-dropdown"
          aria-label={isDropdownOpen ? 'Close navigation' : 'Open on this page navigation'}
        >
          {isDropdownOpen ? (
            // Close icon (X)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
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
          ) : (
            // List icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}

export default OnThisPageNav;
