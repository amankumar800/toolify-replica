'use client';

import { CategoryBrowserProvider } from '@/lib/context/CategoryBrowserContext';

export function CategoryClientWrapper({ children }: { children: React.ReactNode }) {
    return (
        <CategoryBrowserProvider>
            {children}
        </CategoryBrowserProvider>
    );
}
