import { Tool, CategoryGroup } from '@/lib/types/tool';

/**
 * Runtime Data Generator
 * Multiplies the seed data to create a "heavy" dataset for testing performance.
 */

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 15);

export function generateMockTools(seedTools: Tool[], multiplier: number = 5): Tool[] {
    const generated: Tool[] = [...seedTools];

    // Create copies with slight modifications
    for (let i = 0; i < multiplier * seedTools.length; i++) {
        const seed = seedTools[i % seedTools.length];
        generated.push({
            ...seed,
            id: `gen-${generateId()}`,
            name: `${seed.name} ${Math.floor(Math.random() * 1000)}`,
            savedCount: Math.floor(Math.random() * 5000),
            dateAdded: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
            verified: Math.random() > 0.7,
            isNew: Math.random() > 0.8,
            isFeatured: Math.random() > 0.9,
            monthlyVisits: Math.floor(Math.random() * 10000000) + 50000, // 50k to 10M
            changePercentage: parseFloat((Math.random() * 60 - 10).toFixed(1)), // -10% to +50%
        });
    }

    return generated.sort((a, b) => b.savedCount - a.savedCount); // Default Popular sort
}

export function enrichCategoriesWithCounts(groups: CategoryGroup[], tools: Tool[]): CategoryGroup[] {
    return groups.map(group => ({
        ...group,
        categories: group.categories.map(cat => ({
            ...cat,
            toolCount: tools.filter(t => t.categories.includes(cat.name) || t.categories.includes(cat.id)).length
        }))
    }));
}
