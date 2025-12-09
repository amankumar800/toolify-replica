import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryLayoutProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * CategoryLayout
 * Wraps the Category Page content in a wide container (max-w-[1440px])
 * to match Toolify's expansive design on large screens.
 */
export function CategoryLayout({ children, className }: CategoryLayoutProps) {
    return (
        <div className={cn("mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-8", className)}>
            {children}
        </div>
    );
}
