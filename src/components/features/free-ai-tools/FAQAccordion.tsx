'use client';

import React, { useState, useCallback, useId } from 'react';
import { cn } from '@/lib/utils';
import type { FAQItem } from '@/lib/types/free-ai-tools';

/**
 * Props for FAQAccordion component
 */
interface FAQAccordionProps {
  /** Array of FAQ items to display */
  items: FAQItem[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for individual accordion item
 */
interface AccordionItemProps {
  /** FAQ item data */
  item: FAQItem;
  /** Whether this item is currently expanded */
  isExpanded: boolean;
  /** Callback when item is toggled */
  onToggle: () => void;
  /** Unique ID for ARIA attributes */
  itemId: string;
}

/**
 * Individual accordion item component
 * 
 * Features:
 * - ARIA expanded/collapsed states (Requirement 16.3)
 * - Keyboard navigation with Enter/Space to toggle (Requirement 16.3)
 * - 300ms ease-in-out animation (Requirement 10.6)
 */
function AccordionItem({ item, isExpanded, onToggle, itemId }: AccordionItemProps) {
  const buttonId = `faq-button-${itemId}`;
  const contentId = `faq-content-${itemId}`;

  /**
   * Handle keyboard events for accessibility
   * Supports Enter and Space keys to toggle accordion
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );

  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      {/* Accordion Header Button */}
      <button
        id={buttonId}
        type="button"
        className={cn(
          'w-full flex items-center justify-between px-4 py-4 text-left',
          'text-[var(--foreground)] font-medium',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-inset',
          'transition-colors duration-200'
        )}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <span className="pr-4">{item.question}</span>
        {/* Chevron Icon - rotates when expanded */}
        <svg
          className={cn(
            'w-5 h-5 flex-shrink-0 text-[var(--muted-foreground)]',
            'transition-transform duration-300 ease-in-out',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Accordion Content Panel */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          'overflow-hidden',
          'transition-all duration-300 ease-in-out'
        )}
        style={{
          maxHeight: isExpanded ? '500px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4 text-[var(--muted-foreground)] text-sm leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

/**
 * FAQAccordion Component
 * 
 * Expandable FAQ section with single-open accordion behavior.
 * 
 * Features:
 * - Single-open accordion behavior - only one expanded at a time (Requirement 10.5)
 * - 300ms ease-in-out animation for expand/collapse (Requirement 10.6)
 * - ARIA expanded/collapsed states (Requirement 16.3)
 * - Keyboard navigation with Enter/Space to toggle (Requirement 16.3)
 * 
 * @param items - Array of FAQ items to display
 * @param className - Additional CSS classes
 */
export function FAQAccordion({ items, className }: FAQAccordionProps) {
  // Track which item is currently expanded (null = none expanded)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  // Generate unique base ID for ARIA attributes
  const baseId = useId();

  /**
   * Toggle accordion item
   * Implements single-open behavior: clicking an expanded item closes it,
   * clicking a collapsed item opens it and closes any other open item
   */
  const handleToggle = useCallback((index: number) => {
    setExpandedIndex((current) => (current === index ? null : index));
  }, []);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'border border-[var(--border)] rounded-lg bg-white',
        className
      )}
      role="region"
      aria-label="Frequently Asked Questions"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={`${baseId}-${index}`}
          item={item}
          isExpanded={expandedIndex === index}
          onToggle={() => handleToggle(index)}
          itemId={`${baseId}-${index}`}
        />
      ))}
    </div>
  );
}

/**
 * Helper function to determine if an accordion item is expanded
 * Useful for testing and external state management
 */
export function isAccordionItemExpanded(
  expandedIndex: number | null,
  itemIndex: number
): boolean {
  return expandedIndex === itemIndex;
}

export default FAQAccordion;
