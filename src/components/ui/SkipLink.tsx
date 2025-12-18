'use client';

import React from 'react';

interface SkipLinkProps {
  /** Target element ID to skip to (without #) */
  targetId?: string;
  /** Link text */
  children?: React.ReactNode;
}

/**
 * SkipLink Component
 * 
 * Provides a skip link for keyboard users to bypass navigation
 * and jump directly to main content.
 * 
 * Per WCAG 2.1 AA - Requirement 16.2, 16.5:
 * - First focusable element on the page
 * - Visible only when focused
 * - Allows keyboard users to skip repetitive navigation
 * 
 * @param targetId - The ID of the element to skip to (default: "main-content")
 * @param children - Link text (default: "Skip to main content")
 */
export function SkipLink({ 
  targetId = 'main-content', 
  children = 'Skip to main content' 
}: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

export default SkipLink;
