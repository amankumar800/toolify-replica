import { Metadata } from 'next';
import { CategoryLayout } from '@/components/features/category/CategoryLayout';
import { CategorySidebar } from '@/components/features/category/CategorySidebar';
import { CategoryMainList } from '@/components/features/CategoryMainList';
import { CategoryControlBar } from '@/components/features/category/CategoryControlBar';
import { CategoryClientWrapper } from '@/components/features/category/CategoryClientWrapper';
import { MobileCategoryNav } from '@/components/features/category/MobileCategoryNav';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { getCategoryGroups, getTools } from '@/lib/services/tools.service';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'AI Tool Categories | Toolify Replica',
    description: 'Browse all AI tools by category. Find the best AI software for Text, Image, Audio, Video, and more.',
    alternates: {
        canonical: 'https://toolify.ai/category',
    },
    openGraph: {
        title: 'AI Tool Categories | Toolify Replica',
        description: 'Browse all AI tools by category.',
        url: 'https://toolify.ai/category',
        siteName: 'Toolify Replica',
        locale: 'en_US',
        type: 'website',
    },
};

export default async function CategoryPage() {
    const [groups, { tools: allTools }] = await Promise.all([
        getCategoryGroups(),
        getTools('', undefined, 1, 2000)
    ]);

    // Advanced JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
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
            },
            {
                '@type': 'CollectionPage',
                'name': 'AI Tool Categories',
                'description': 'Comprehensive directory of AI tools categorized by function.',
                'url': 'https://toolify.ai/category',
                'about': {
                    '@type': 'Thing',
                    'name': 'Artificial Intelligence Software'
                }
            }
        ]
    };

    return (
        <main className="min-h-screen bg-toolify-bg">
            <CategoryClientWrapper>
                <MobileCategoryNav groups={groups} />

                <CategoryLayout className="flex gap-8 relative py-8">
                    {/* Desktop Sidebar - Sticky */}
                    <aside className="hidden lg:block w-[280px] flex-shrink-0 z-sidebar">
                        <div className="sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
                            <CategorySidebar groups={groups} />
                        </div>
                    </aside>

                    {/* Main Content - Fluid */}
                    <div className="flex-1 min-w-0">
                        <div className="px-4 lg:px-0 mt-4 lg:mt-0">
                            <Breadcrumb items={[{ label: 'Categories' }]} />
                        </div>

                        {/* Header */}
                        <div className="mb-0 lg:mb-8 mt-2 px-4 lg:px-0">
                            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-toolify-black mb-2">
                                        Find AI By Categories
                                    </h1>
                                    <p className="text-sm lg:text-base text-toolify-gray-500">
                                        Discover {allTools.length}+ AI tools across {groups.length} major categories
                                    </p>
                                </div>
                            </div>

                            {/* Filters & Search */}
                            <CategoryControlBar />
                        </div>

                        <CategoryMainList groups={groups} allTools={allTools} />
                    </div>
                </CategoryLayout>

                <ScrollToTop />
            </CategoryClientWrapper>

            <Script
                id="category-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </main>
    );
}
