'use client';

import { useState, useEffect } from 'react';

export function useScrollSpy(
    selectors: string[],
    options?: IntersectionObserverInit
): string {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveId(entry.target.getAttribute('id') || '');
                }
            });
        }, {
            rootMargin: '-20% 0px -35% 0px', // Adjust to trigger when section is near top
            threshold: 0,
            ...options,
        });

        selectors.forEach((selector) => {
            const element = document.querySelector(selector);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [selectors, options]);

    return activeId;
}
