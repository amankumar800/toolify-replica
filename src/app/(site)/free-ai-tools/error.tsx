'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Error Boundary for Free AI Tools Pages
 * 
 * Catches rendering errors in Free AI Tools pages and displays
 * user-friendly error messages with recovery options.
 * 
 * Features:
 * - User-friendly error message with retry button - Requirement 18.1, 18.2
 * - Suggest valid categories on 404 errors - Requirement 18.1
 * - Log error details for debugging - Requirement 18.2
 */

/**
 * Popular categories to suggest when errors occur
 * These are the most commonly used categories
 */
const SUGGESTED_CATEGORIES = [
  { name: 'Chatbots & Virtual Companions', slug: 'chatbots-virtual-companions', icon: '💬' },
  { name: 'Image Generation & Editing', slug: 'image-generation-editing', icon: '🖼️' },
  { name: 'Writing & Editing', slug: 'writing-editing', icon: '✍️' },
  { name: 'Coding & Development', slug: 'coding-development', icon: '💻' },
  { name: 'Video & Animation', slug: 'video-animation', icon: '🎬' },
  { name: 'Art & Creative Design', slug: 'art-creative-design', icon: '🎨' },
];

/**
 * Check if the error is a 404 Not Found error
 */
function isNotFoundError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('not found') ||
    message.includes('404') ||
    message.includes('does not exist') ||
    message.includes('invalid category')
  );
}

/**
 * Error Icon Component
 */
function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}


/**
 * Category Suggestions Component
 * Displays a list of valid categories when a 404 error occurs
 */
function CategorySuggestions() {
  return (
    <div className="mt-8 w-full max-w-lg">
      <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-4 text-center">
        Try one of these popular categories:
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {SUGGESTED_CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`/free-ai-tools/${category.slug}`}
            className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            <span className="text-base" aria-hidden="true">
              {category.icon}
            </span>
            <span className="text-[var(--foreground)] truncate">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/free-ai-tools"
          className="text-sm text-[var(--primary)] hover:underline"
        >
          View all categories →
        </Link>
      </div>
    </div>
  );
}

/**
 * Error Props Interface
 */
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary Component
 * 
 * Displays appropriate error messages based on error type:
 * - 404 errors: Shows category suggestions
 * - Network errors: Shows retry button
 * - Other errors: Shows generic error message with retry
 */
export default function Error({ error, reset }: ErrorProps) {
  const is404 = isNotFoundError(error);

  // Log error details for debugging - Requirement 18.2
  useEffect(() => {
    console.error('[Free AI Tools Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="container py-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 mb-6 text-[var(--muted-foreground)]">
          <ErrorIcon className="w-full h-full" />
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {is404 ? 'Category Not Found' : 'Something went wrong'}
        </h1>

        {/* Error Description */}
        <p className="text-[var(--muted-foreground)] mb-6 max-w-md">
          {is404
            ? "We couldn't find the category you're looking for. It may have been moved or doesn't exist."
            : 'An error occurred while loading this page. Please try again or browse our categories.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          {/* Retry Button - Requirement 18.2 */}
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>

          {/* Browse Categories Link */}
          <Link
            href="/free-ai-tools"
            className="px-6 py-2.5 bg-gray-100 text-[var(--foreground)] rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Browse all tools
          </Link>
        </div>

        {/* Category Suggestions for 404 errors - Requirement 18.1 */}
        {is404 && <CategorySuggestions />}

        {/* Error Details (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 w-full max-w-lg text-left">
            <summary className="text-sm text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)]">
              Error details (development only)
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
              {JSON.stringify(
                {
                  message: error.message,
                  digest: error.digest,
                  stack: error.stack,
                },
                null,
                2
              )}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
