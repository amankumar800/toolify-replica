'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { MobileSearchModal } from '@/components/features/search/MobileSearchModal';

/**
 * HeaderMobileSearch - Isolated client component for mobile search functionality
 * 
 * This component isolates the mobile search state management to minimize
 * the client boundary in the Header component.
 */
export function HeaderMobileSearch() {
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className="md:hidden p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                aria-label="Search"
                onClick={() => setIsMobileSearchOpen(true)}
            >
                <Search className="w-5 h-5" />
            </button>

            <MobileSearchModal
                isOpen={isMobileSearchOpen}
                onClose={() => setIsMobileSearchOpen(false)}
            />
        </>
    );
}
