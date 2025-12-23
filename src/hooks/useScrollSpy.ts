'use client';

import { useState, useEffect } from 'react';

/**
 * useScrollSpy
 * Detects which section is currently active in the viewport.
 * @param ids List of Section IDs to monitor
 * @param offset px offset from top (header height)
 */
export function useScrollSpy(ids: string[], offset: number = 100) {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: `-${offset}px 0px -50% 0px`,
            }
        );

        ids.forEach((id) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [ids, offset]);

    return activeId;
}
