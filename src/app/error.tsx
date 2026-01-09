'use client';

/**
 * Global Error Page
 * 
 * This page is shown when an unhandled error occurs in the app.
 * It captures the error to Sentry and provides a user-friendly message.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'app-error-page',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Oops! Something went wrong
          </h1>
          
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>

          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-100 rounded-lg p-4 mb-6">
              <summary className="cursor-pointer font-medium text-gray-700">
                Error Details (Development Only)
              </summary>
              <div className="mt-3 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {error.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Message:</span> {error.message}
                </p>
                {error.digest && (
                  <p className="text-sm">
                    <span className="font-medium">Digest:</span> {error.digest}
                  </p>
                )}
                {error.stack && (
                  <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-48 bg-white p-2 rounded">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Error ID for support */}
          {error.digest && (
            <p className="text-xs text-gray-500 mb-6">
              Error Reference: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[var(--primary)] hover:opacity-90 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
          
          <Link
            href="/"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-500">
          If this problem persists, please{' '}
          <a
            href="mailto:support@aitoolsbook.com"
            className="text-[var(--primary)] hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
