import { getTools } from '@/lib/services/tools.service';
import { ToolGrid } from './ToolGrid';
import type { Tool } from '@/lib/types/tool';

export async function FeaturedTools() {
    const { items } = await getTools({ limit: 12 });

    // Map to Tool type expected by ToolGrid
    const tools: Tool[] = items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description ?? '',
        shortDescription: item.short_description ?? '',
        image: item.image_url ?? '',
        websiteUrl: item.website_url,
        pricing: (item.pricing ?? 'Free') as Tool['pricing'],
        categories: [],
        tags: item.tags ?? [],
        savedCount: 0,
        reviewCount: item.review_count ?? 0,
        reviewScore: item.review_score ?? 0,
        isFeatured: item.is_featured ?? false,
        isNew: item.is_new ?? false,
    }));

    return <ToolGrid initialTools={tools} />;
}
