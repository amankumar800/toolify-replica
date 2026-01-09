'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminDashboardError');

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminDashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'admin-dashboard', section: 'admin' },
      extra: { digest: error.digest },
    });
    log.error('Admin dashboard error', error, { data: { digest: error.digest } });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-3">Dashboard Error</h1>
      <p className="text-gray-600 mb-6">An error occurred while loading the dashboard.</p>
      <button onClick={reset} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Try Again</button>
    </div>
  );
}
