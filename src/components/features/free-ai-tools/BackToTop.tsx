'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface BackToTopProps {
  /** Scroll threshold in pixels before button appears. Default: 500px */
  threshold?: number;
}

/**
 * Determines if the back-to-top button should be visible based on scroll position.
 * Exported for testing purposes.
 * 
 * @param scrollY - Current scroll position
 * @param threshold - Threshold in pixels
 * @returns true if button should be visible
 */
export function shouldShowBackToTop(scrollY: number, threshold: number): boolean {
  return scrollY > threshold;
}

/**
 * BackToTop Component
 * 
 * A floating button that appears after scrolling past a threshold (default 500px)
 * and smoothly scrolls the page back to the top when clicked.
 * 
 * Features:
 * - Floating button in bottom-right corner (bottom: 24px, right: 24px)
 * - Appears after scrolling 500px (configurable via threshold prop)
 * - Smooth scroll to top on click
 * - Fade in/out animation
 * - Fixed positioning
 * 
 * @requirements 20.6
 */
export function BackToTop({ threshold = 500 }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = useCallback(() => {
    setIsVisible(shouldShowBackToTop(window.scrollY, threshold));
  }, [threshold]);

  useEffect(() => {
    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  return (
    <Button
      onClick={scrollToTop}
      variant="default"
      size="icon"
      className={cn(
        // Fixed positioning: bottom 24px, right 24px
        'fixed bottom-6 right-6 z-50',
        // Rounded button with shadow
        'rounded-full shadow-lg',
        // Fade in/out animation with transition
        'transition-all duration-300 ease-in-out',
        // Visibility states
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      )}
      aria-label="Back to top"
      aria-hidden={!isVisible}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}

export default BackToTop;
