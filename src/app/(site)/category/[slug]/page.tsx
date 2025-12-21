
import { Container } from '@/components/layout/Container';
import { ToolGrid } from '@/components/features/ToolGrid';
import { getTools } from '@/lib/services/tools.service';

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
    const { slug } = await params;
    return {
        title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} AI Tools - Toolify.ai`,
        description: `Browse the best ${slug.replace(/-/g, ' ')} AI tools.`,
    };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
    const { slug } = await params;
    const { q } = await searchParams;
    const tools = await getTools({ search: q, category: slug });
    const total = tools.length;
    const categoryName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

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
