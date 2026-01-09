'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';
import { createLogger } from '@/lib/logger';

const log = createLogger('MidjourneyDetailError');

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MidjourneyDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'midjourney-detail', page: 'midjourney-detail' },
      extra: { digest: error.digest },
    });
    log.error('Midjourney detail error', error, { data: { digest: error.digest } });
  }, [error]);

  return (
    <div className="container py-8">
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 mb-6 text-[var(--muted-foreground)]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Prompt Not Available</h1>
        <p className="text-[var(--muted-foreground)] mb-6 max-w-md">We couldn&apos;t load this prompt. It may have been removed or there was an error.</p>
        <div className="flex gap-4">
          <button onClick={reset} className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Try again</button>
          <Link href="/midjourney-library" className="px-6 py-2.5 bg-[var(--muted)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--muted)]/80 transition-colors">Browse Prompts</Link>
        </div>
      </div>
    </div>
  );
}
