'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'admin-panel' },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-16 h-16 mb-6 rounded-full bg-red-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Admin Panel Error
      </h1>

      <p className="text-gray-600 mb-6 max-w-md">
        An error occurred in the admin panel. This has been logged for investigation.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <details className="mb-6 w-full max-w-lg text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Error details (development only)
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-48">
            {JSON.stringify({ message: error.message, digest: error.digest, stack: error.stack }, null, 2)}
          </pre>
        </details>
      )}

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/admin/dashboard"
          className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-gray-500">
          Error Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
