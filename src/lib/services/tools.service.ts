import { cache } from 'react';
import { Tool, Category, CategoryGroup } from '@/lib/types/tool';
import mockDb from '@/data/mock-db.json';
import { generateMockTools, enrichCategoriesWithCounts } from '@/lib/utils/mock-generator';

// Cache the heavy generation so it only happens once per server lifecycle
const getDatabase = cache(() => {
    const rawTools = mockDb.tools as Tool[];
    const rawGroups = mockDb.categoryGroups as CategoryGroup[];

    // Generate 1000+ tools for realistic stress testing
    const tools = generateMockTools(rawTools, 50); // 20 * 50 = 1000 tools

    // Compute real-time counts
    const categoryGroups = enrichCategoriesWithCounts(rawGroups, tools);

    return {
        tools,
        categoryGroups
    };
});

/**
 * Fetches tools with optional filtering, pagination, and sorting.
 * Caches the result using React.cache for request-scoped deduplication.
 * 
 * @param query - Search term for tool name or description
 * @param categorySlug - Slug of the category to filter by
 * @param page - Page number (1-based)
 * @param limit - Number of items per page
 * @param sort - Sorting method ('newest' | 'popular')
 */
export const getTools = cache(async (
    query?: string,
    categorySlug?: string,
    page: number = 1,
    limit: number = 20,
    sort?: 'newest' | 'popular'
): Promise<{ tools: Tool[]; total: number }> => {
    const db = getDatabase();

    // Simulate network latency (reduced for better UX during dev)
    await new Promise(resolve => setTimeout(resolve, 100));

    let filtered = db.tools;

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
    const db = getDatabase();
    // Flatten categories from groups
    const allCategories: Category[] = [];
    db.categoryGroups.forEach((g: any) => {
        if (g.categories) {
            allCategories.push(...g.categories);
        }
    });
    return allCategories;
});

export const getToolBySlug = cache(async (slug: string): Promise<Tool | undefined> => {
    const db = getDatabase();
    return db.tools.find(t => t.slug === slug);
});

// For Typeahead
export const searchTools = cache(async (query: string): Promise<Tool[]> => {
    if (!query || query.length < 2) return [];

    const db = getDatabase();
    const q = query.toLowerCase();

    // Fast partial match for typeahead
    return db.tools.filter(t =>
        t.name.toLowerCase().includes(q)
    ).slice(0, 5); // Limit 5 for dropdown
});

export const getCategoryGroups = cache(async (): Promise<CategoryGroup[]> => {
    const db = getDatabase();
    return db.categoryGroups;
});
