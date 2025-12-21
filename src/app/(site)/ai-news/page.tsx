import { Suspense } from 'react';
import { Metadata } from 'next';
import { NewsService, TimeFilter } from '@/lib/services/news.service';
import { NewsCard } from '@/components/features/news/NewsCard';
import { NewsSidebar } from '@/components/features/news/NewsSidebar';
import { NewsFilters } from '@/components/features/news/NewsFilters';
import { StatsBanner } from '@/components/features/news/StatsBanner';
import { NewsBreadcrumbs } from '@/components/features/news/NewsBreadcrumbs';

export const metadata: Metadata = {
    title: 'Daily AI News | Latest Artificial Intelligence Updates',
    description: 'Stay updated with the latest AI news, breakthroughs, and research papers. Comprehensive coverage of ChatGPT, Gemini, Midjourney, and more.',
    openGraph: {
        title: 'Daily AI News - Toolify.ai',
        description: 'Latest AI News & Updates',
        type: 'website',
    }
};

export default async function NewsPage(props: {
    searchParams?: Promise<{ filter?: string; q?: string; category?: string }>
}) {
    const searchParams = await props.searchParams;
    const filter = (searchParams?.filter || 'daily') as TimeFilter;
    const searchQuery = searchParams?.q || '';

    const { items: newsItems, total } = await NewsService.getAllNews(1, 20, filter);
    const stats = await NewsService.getNewsStats();
    const trendingNews = await NewsService.getTrendingNews();

    // Apply search filter
    const filteredNews = searchQuery
        ? newsItems.filter(n =>
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.summary.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : newsItems;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <NewsBreadcrumbs />

            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4">
                    Daily AI News
                </h1>

                {/* Stats Banner */}
                <StatsBanner
                    totalAnalyzed={stats.totalAnalyzed}
                    importantStories={stats.importantStories}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-8">
                    {/* Filters - Wrapped in Suspense for useSearchParams */}
                    <Suspense fallback={<div className="h-14 bg-muted/30 rounded-lg animate-pulse mb-6" />}>
                        <NewsFilters />
                    </Suspense>

                    {/* Search Results Info */}
                    {searchQuery && (
                        <div className="mb-4 text-sm text-muted-foreground">
                            Found <span className="font-medium text-foreground">{filteredNews.length}</span> results
                            for "<span className="font-medium text-foreground">{searchQuery}</span>"
                        </div>
                    )}

                    {/* News Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredNews.map((item) => (
                            <div key={item.id} className="h-full">
                                <NewsCard news={item} />
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredNews.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg">No news found for this filter.</p>
                            <p className="text-sm mt-2">Try adjusting your search or filter criteria.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4">
                    <NewsSidebar news={trendingNews} />

                    <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/20">
                        <h3 className="font-bold text-lg mb-2">Subscribe to Newsletter</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Get the latest AI news delivered to your inbox every morning.
                        </p>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full px-3 py-2 rounded-md border bg-background mb-2 text-sm"
                        />
                        <button className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
                            Subscribe
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
