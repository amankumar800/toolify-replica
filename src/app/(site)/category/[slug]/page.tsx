// ISR revalidation - cache for 1 hour
export const revalidate = 3600;

import { Container } from '@/components/layout/Container';
import { ToolGrid } from '@/components/features/ToolGrid';
import { getTools } from '@/lib/services/tools.service';
import { getCategoryGroups } from '@/lib/services/categories.service';
import type { Tool } from '@/lib/types/tool';

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ q?: string }>;
}

/**
 * Generate static params for category pages at build time
 */
export async function generateStaticParams() {
    try {
        const groups = await getCategoryGroups();
        const slugs: { slug: string }[] = [];
        
        for (const group of groups) {
            for (const category of group.categories) {
                slugs.push({ slug: category.slug });
            }
        }
        
        return slugs;
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: CategoryPageProps) {
    const { slug } = await params;
    return {
        title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} AI Tools - AI Tools Book`,
        description: `Browse the best ${slug.replace(/-/g, ' ')} AI tools.`,
    };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const { q } = await searchParams;
    const { items, total } = await getTools({ search: q, category: slug });
    const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

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

    if (!tools.length && !q) {
        // If truly empty and not just a search result empty, maybe 404 or just show empty state
        // For now, let's allow it to render empty grid
    }

    return (
        <div className="min-h-screen pb-20">
            <div className="bg-[var(--muted)]/30 border-b border-[var(--border)] py-12">
                <Container>
                    <h1 className="text-4xl font-bold mb-4">{categoryName}</h1>
                    <p className="text-[var(--muted-foreground)]">
                        Explore the top {total} {categoryName} tools.
                    </p>
                </Container>
            </div>

            <Container>
                <ToolGrid initialTools={tools} category={slug} />
            </Container>
        </div>
    );
}
