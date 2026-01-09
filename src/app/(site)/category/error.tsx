'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('CategoryError');

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        log.error('Category page error', error, { data: { digest: error.digest } });
    }, [error]);

    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-bold">Something went wrong!</h2>
            <button
                className="rounded-md bg-toolify-purple-600 px-4 py-2 text-white hover:bg-toolify-purple-700"
                onClick={() => reset()}
            >
                Try again
            </button>
        </div>
    );
}
