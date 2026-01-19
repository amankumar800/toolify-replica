import { useEffect, RefObject, useRef } from 'react';

/**
 * Hook to detect clicks outside of a referenced element.
 * Uses ref pattern for stable subscriptions - handler changes don't cause re-subscriptions.
 * 
 * @param ref - React ref to the element to monitor
 * @param handler - Callback when click outside is detected
 * @param enabled - Whether the hook is active (default: true)
 * 
 * @example
 * ```tsx
 * const dropdownRef = useRef<HTMLDivElement>(null);
 * useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);
 * ```
 */
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    handler: (event: MouseEvent | TouchEvent) => void,
    enabled: boolean = true
): void {
    // Store handler in ref to avoid re-subscriptions when handler changes
    const handlerRef = useRef(handler);

    // Update ref on every render to capture latest handler
    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(() => {
        if (!enabled) return;

        const listener = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;

            // Do nothing if clicking ref's element or descendent elements
            if (!ref.current || ref.current.contains(target)) {
                return;
            }

            // Call the latest handler via ref
            handlerRef.current(event);
        };

        // Use mousedown/touchstart for immediate response
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, enabled]); // handler removed - ref pattern handles updates
}

export default useClickOutside;

