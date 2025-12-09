import { Container } from '@/components/layout/Container';
import { CategorySidebar } from '@/components/features/CategorySidebar';
import { CategoryMainList } from '@/components/features/CategoryMainList';
import { getCategoryGroups } from '@/lib/services/tools.service';
import Script from 'next/script';

export const metadata = {
    title: 'AI Tool Categories | Toolify Replica',
    description: 'Browse all AI tools by category. Find the best AI software for Text, Image, Audio, Video, and more.',
};

export default async function CategoryPage() {
    const groups = await getCategoryGroups();

    // JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': 'https://toolify.ai'
            },
            {
                '@type': 'ListItem',
                'position': 2,
                'name': 'Categories',
                'item': 'https://toolify.ai/category'
            }
        ]
    };

    return (
        <main className="min-h-screen pb-20 pt-8" style={{ backgroundColor: '#fff' }}>
            <Container>
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Find AI By Categories
                    </h1>
                    <p className="text-lg text-gray-500">
                        Discover 10,000+ AI tools across {groups.length} major categories
                    </p>
                </div>

                <div className="flex gap-12 relative">
                    <CategorySidebar groups={groups} />
                    <CategoryMainList groups={groups} />
                </div>
            </Container>

            <Script
                id="category-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </main>
    );
}
