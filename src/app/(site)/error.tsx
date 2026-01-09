'use client';

/**
 * Site Layout Error Boundary
 * 
 * Catches errors in the main site layout and provides user-friendly recovery options.
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';
import { createLogger } from '@/lib/logger';

const log = createLogger('SiteError');

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SiteError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'site-layout' },
      extra: { digest: error.digest },
    });
    log.error('Site layout error', error, { data: { digest: error.digest } });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">Something went wrong</h1>
        <p className="text-[var(--muted-foreground)] mb-6">We encountered an error loading this page. Please try again.</p>

        {error.digest && (
          <p className="text-xs text-[var(--muted-foreground)] mb-4">Error Reference: {error.digest}</p>
        )}

        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
            Try Again
          </button>
          <Link href="/" className="px-5 py-2.5 bg-[var(--muted)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--muted)]/80 transition-colors">
            Go Home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-[var(--muted-foreground)] cursor-pointer">Error details</summary>
            <pre className="mt-2 p-3 bg-[var(--muted)] rounded text-xs overflow-auto">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
