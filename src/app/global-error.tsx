'use client';

/**
 * Global Error Page (Root Layout Level)
 * 
 * This page handles errors that occur in the root layout itself.
 * It must define its own <html> and <body> tags since the root layout
 * may have failed to render.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to Sentry with high severity
    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        errorBoundary: 'global-error-page',
        critical: 'true',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: '#f9fafb',
          }}
        >
          <div
            style={{
              maxWidth: '32rem',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: '5rem',
                height: '5rem',
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                style={{ width: '2.5rem', height: '2.5rem', color: '#dc2626' }}
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

            <h1
              style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '0.75rem',
              }}
            >
              Critical Error
            </h1>

            <p
              style={{
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              A critical error occurred while loading the application. 
              Our team has been automatically notified.
            </p>

            {error.digest && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: '1.5rem',
                }}
              >
                Error Reference: {error.digest}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontWeight: 500,
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
