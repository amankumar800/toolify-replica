'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function isNotFoundError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes('not found') || message.includes('404') || message.includes('does not exist');
}

export default function ToolError({ error, reset }: ErrorProps) {
  const is404 = isNotFoundError(error);

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'tool-page' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="container py-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 mb-6 text-[var(--muted-foreground)]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {is404 ? 'Tool Not Found' : 'Unable to load tool'}
        </h1>

        <p className="text-[var(--muted-foreground)] mb-6 max-w-md">
          {is404
            ? "We couldn't find the tool you're looking for. It may have been removed or the URL is incorrect."
            : 'We encountered an error while loading this tool. Please try again.'}
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/free-ai-tools"
            className="px-6 py-2.5 bg-[var(--muted)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--muted)]/80 transition-colors"
          >
            Browse all tools
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-[var(--muted-foreground)]">
            Error Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
