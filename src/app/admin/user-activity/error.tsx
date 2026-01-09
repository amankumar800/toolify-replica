'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import Link from 'next/link';
import { createLogger } from '@/lib/logger';

const log = createLogger('AdminUserActivityError');

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminUserActivityError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { errorBoundary: 'admin-user-activity', section: 'admin' },
      extra: { digest: error.digest },
    });
    log.error('Admin user activity error', error, { data: { digest: error.digest } });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-3">Failed to load User Activity</h1>
      <p className="text-gray-600 mb-6">An error occurred while loading the user activity page.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Try Again</button>
        <Link href="/admin/dashboard" className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Dashboard</Link>
      </div>
    </div>
  );
}
