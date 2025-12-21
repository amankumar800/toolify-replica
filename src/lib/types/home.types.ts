import { z } from 'zod';

// ============================================
// SCHEMAS FOR RUNTIME VALIDATION
// ============================================

/**
 * Schema for tools in the "My Tools" section
 * @see MyToolsSection.tsx
 */
export const MyToolSchema = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().url(),
    url: z.string(),
    color: z.string(),
});

/**
 * Schema for featured tool cards
 * @see CompactToolCard.tsx, ToolCardsGrid.tsx
 */
export const FeaturedToolSchema = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().url(),
    iconBgColor: z.string(),
    description: z.string(),
    isFree: z.boolean(),
    slug: z.string(),
    websiteUrl: z.string().url().optional(),
});

/**
 * Schema for category items in the category grid
 * @see CategoryGrid.tsx
 */
export const CategoryItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    icon: z.string(),
    toolCount: z.number().int().nonnegative(),
    color: z.string(),
});

/**
 * Schema for filter tabs
 * @see FilterTabs.tsx
 */
export const FilterTabSchema = z.object({
    id: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    href: z.string().optional(),
    isExternal: z.boolean().optional(),
});

/**
 * Schema for homepage stats
 * @see StatsBar.tsx
 */
export const HomeStatsSchema = z.object({
    totalTools: z.number().int().nonnegative(),
    totalCategories: z.number().int().nonnegative(),
});

// ============================================
// INFERRED TYPES
// ============================================

export type MyTool = z.infer<typeof MyToolSchema>;
export type FeaturedTool = z.infer<typeof FeaturedToolSchema>;
export type CategoryItem = z.infer<typeof CategoryItemSchema>;
export type FilterTab = z.infer<typeof FilterTabSchema>;
export type HomeStats = z.infer<typeof HomeStatsSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Safely parse data with schema, returning null on failure
 */
export function safeParseArray<T>(
    schema: z.ZodType<T>,
    data: unknown
): T[] | null {
    const result = z.array(schema).safeParse(data);
    if (!result.success) {
        console.error('Validation error:', result.error.format());
        return null;
    }
    return result.data;
}
