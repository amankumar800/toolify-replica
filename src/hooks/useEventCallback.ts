'use client';

import { useRef, useEffect, useCallback } from 'react';

/**
 * Creates a stable callback reference that always invokes the latest version.
 * This prevents unnecessary re-subscriptions when callbacks are used in effects.
 * 
 * Use this when you need to pass a callback to useEffect but don't want the
 * effect to re-run when the callback changes (e.g., event handlers).
 * 
 * @example
 * ```tsx
 * function useWindowEvent(event: string, handler: (e: Event) => void) {
 *   const stableHandler = useEventCallback(handler);
 *   
 *   useEffect(() => {
 *     window.addEventListener(event, stableHandler);
 *     return () => window.removeEventListener(event, stableHandler);
 *   }, [event, stableHandler]); // stableHandler never changes
 * }
 * ```
 * 
 * @see https://react.dev/learn/separating-events-from-effects
 */
export function useEventCallback<T extends (...args: never[]) => unknown>(
    callback: T
): T {
    const callbackRef = useRef<T>(callback);

    // Update ref on every render to capture latest callback
    // Using useEffect (not useLayoutEffect) for SSR compatibility
    useEffect(() => {
        callbackRef.current = callback;
    });

    // Return stable function that always calls latest callback
    // Empty deps array ensures this function reference never changes
    return useCallback(
        (...args: Parameters<T>) => callbackRef.current(...args),
        []
    ) as T;
}

export default useEventCallback;
