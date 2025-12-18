'use client';

import { useEffect, useState } from 'react';

/**
 * Loading Skeleton for Free AI Tools Pages
 * 
 * Displays a skeleton UI that matches the layout structure of the actual content
 * while data is being fetched.
 * 
 * Features:
 * - Skeleton matching layout structure (sidebar, content, right panel) - Requirement 17.1
 * - Skeleton placeholders for each category item - Requirement 17.2
 * - Skeleton cards matching Tool_Card dimensions - Requirement 17.3
 * - Animated pulse effect using Tailwind animate-pulse
 * - Timeout handling with error message after 10 seconds - Requirement 17.5
 */

/**
 * Sidebar Skeleton Component
 * Displays placeholder for the CategorySidebar with AD banner and category items
 */
function SidebarSkeleton() {
  return (
    <aside className="hidden md:block w-60 flex-shrink-0">
      <div className="sticky top-[calc(var(--header-height)+1rem)] space-y-4 pr-4">
        {/* AD Banner Skeleton */}
        <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-20 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-3 w-full bg-gray-200 rounded mb-2" />
          <div className="h-3 w-3/4 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-full bg-gray-200 rounded" />
        </div>

        {/* Introduction Link Skeleton */}
        <div className="flex items-center gap-3 px-3 py-2 animate-pulse">
          <div className="w-5 h-5 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>

        {/* Section Header Skeleton */}
        <div className="px-3 animate-pulse">
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>

        {/* Category Items Skeleton - 22 categories */}
        <div className="space-y-1 animate-pulse">
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div 
                  className="h-4 bg-gray-200 rounded" 
                  style={{ width: `${80 + Math.random() * 60}px` }}
                />
              </div>
              <div className="w-6 h-4 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}


/**
 * Main Content Skeleton Component
 * Displays placeholder for the main content area including hero, sections, and FAQ
 */
function ContentSkeleton() {
  return (
    <main className="flex-1 min-w-0 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="mb-8">
        <div className="h-10 w-80 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-full max-w-xl bg-gray-100 rounded mb-2" />
        <div className="h-4 w-3/4 max-w-lg bg-gray-100 rounded mb-6" />
        
        {/* CTA Buttons Skeleton */}
        <div className="flex gap-4">
          <div className="h-10 w-36 bg-gray-200 rounded-lg" />
          <div className="h-10 w-32 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Why Use Section Skeleton */}
      <div className="mb-8">
        <div className="h-6 w-72 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full mb-3" />
              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-full bg-gray-100 rounded mb-1" />
              <div className="h-3 w-3/4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 3 Steps Section Skeleton */}
      <div className="mb-8">
        <div className="h-6 w-64 bg-gray-200 rounded mb-4" />
        <div className="flex flex-col md:flex-row gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 bg-gray-50 rounded-lg p-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full mb-3" />
              <div className="h-5 w-28 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-full bg-gray-100 rounded mb-1" />
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section Skeleton */}
      <div className="mb-8">
        <div className="h-6 w-80 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-gray-200 rounded" style={{ width: `${200 + Math.random() * 150}px` }} />
                <div className="w-5 h-5 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prev/Next Navigation Skeleton */}
      <div className="flex justify-between pt-6 border-t border-gray-100">
        <div className="h-10 w-32 bg-gray-100 rounded" />
        <div className="h-10 w-40 bg-gray-200 rounded" />
      </div>
    </main>
  );
}

/**
 * Right Panel Skeleton Component
 * Displays placeholder for the Featured Tools panel
 */
function RightPanelSkeleton() {
  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="sticky top-[calc(var(--header-height)+1rem)] animate-pulse">
        {/* Featured Header Skeleton */}
        <div className="h-5 w-20 bg-gray-200 rounded mb-4" />
        
        {/* Featured Tool Cards Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-full bg-gray-100 rounded mb-1" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}


/**
 * Timeout Message Component
 * Displays an error message when loading takes too long
 */
function TimeoutMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 mb-4 text-[var(--muted-foreground)]">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" 
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
        Loading is taking longer than expected
      </h2>
      <p className="text-[var(--muted-foreground)] mb-6 max-w-md">
        The page is taking a while to load. This might be due to a slow connection or server issues.
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Main Loading Component
 * 
 * Displays the full loading skeleton with timeout handling.
 * After 10 seconds, shows a timeout message with retry option.
 */
export default function Loading() {
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    // Set timeout for 10 seconds - Requirement 17.5
    const timeoutId = setTimeout(() => {
      setIsTimedOut(true);
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleRetry = () => {
    // Reset timeout state and reload the page
    setIsTimedOut(false);
    window.location.reload();
  };

  if (isTimedOut) {
    return (
      <div className="container py-8">
        <TimeoutMessage onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex gap-8">
        {/* Left Sidebar Skeleton */}
        <SidebarSkeleton />

        {/* Main Content Skeleton */}
        <ContentSkeleton />

        {/* Right Panel Skeleton */}
        <RightPanelSkeleton />
      </div>
    </div>
  );
}
