import { cache } from 'react';
import { Tool, Category, CategoryGroup } from '@/lib/types/tool';
import mockDb from '@/data/mock-db.json';

// Performance Engineer: React.cache() is crucial to dedup in Server Components
export const getTools = cache(async (
    query?: string,
    categorySlug?: string,
    page: number = 1,
    limit: number = 20,
    sort?: 'newest' | 'popular'
): Promise<{ tools: Tool[]; total: number }> => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = mockDb.tools as Tool[];

    if (categorySlug) {
        filtered = filtered.filter(t => t.categories.some(c =>
            c.toLowerCase().replace(/\s+/g, '-') === categorySlug
        ));
    }

    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))
        );
    }

    // Sorting Logic
    if (sort === 'newest') {
        filtered.sort((a, b) => {
            const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
            const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
            return dateB - dateA; // Descending
        });
    } else if (sort === 'popular') {
        filtered.sort((a, b) => b.savedCount - a.savedCount); // Descending
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    return {
        tools: filtered.slice(start, end),
        total: filtered.length
    };
});

export const getCategories = cache(async (): Promise<Category[]> => {
    // Flatten categories from groups for backward compatibility
    const groups = mockDb.categoryGroups || [];
    const allCategories: Category[] = [];
    groups.forEach((g: any) => {
        if (g.categories) {
            allCategories.push(...g.categories);
        }
    });
    return allCategories;
});

export const getToolBySlug = cache(async (slug: string): Promise<Tool | undefined> => {
    return (mockDb.tools as Tool[]).find(t => t.slug === slug);
});

// For Typeahead
export const searchTools = cache(async (query: string): Promise<Tool[]> => {
    if (!query || query.length < 2) return [];

    // Fast partial match for typeahead
    const q = query.toLowerCase();
    return (mockDb.tools as Tool[]).filter(t =>
        t.name.toLowerCase().includes(q)
    ).slice(0, 5); // Limit 5 for dropdown
});

export const getCategoryGroups = cache(async (): Promise<CategoryGroup[]> => {
    return mockDb.categoryGroups || [];
});
