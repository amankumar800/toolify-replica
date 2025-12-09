'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CategoryBrowserContextType {
    activeSectionId: string;
    setActiveSectionId: (id: string) => void;
    isScrolling: boolean;
    setIsScrolling: (isScrolling: boolean) => void;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortBy: 'popular' | 'newest';
    setSortBy: (sort: 'popular' | 'newest') => void;
}

const CategoryBrowserContext = createContext<CategoryBrowserContextType | undefined>(undefined);

export function CategoryBrowserProvider({ children }: { children: ReactNode }) {
    const [activeSectionId, setActiveSectionId] = useState<string>('');
    const [isScrolling, setIsScrolling] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');

    return (
        <CategoryBrowserContext.Provider value={{
            activeSectionId,
            setActiveSectionId,
            isScrolling,
            setIsScrolling,
            mobileMenuOpen,
            setMobileMenuOpen,
            searchQuery,
            setSearchQuery,
            sortBy,
            setSortBy
        }}>
            {children}
        </CategoryBrowserContext.Provider>
    );
}

export function useCategoryBrowser() {
    const context = useContext(CategoryBrowserContext);
    if (context === undefined) {
        throw new Error('useCategoryBrowser must be used within a CategoryBrowserProvider');
    }
    return context;
}
