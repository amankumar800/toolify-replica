import { Suspense } from 'react';
import { Metadata } from 'next';
import { NewsService, TimeFilter } from '@/lib/services/news.service';
import { NewsCard } from '@/components/features/news/NewsCard';
import { NewsSidebar } from '@/components/features/news/NewsSidebar';
import { NewsFilters } from '@/components/features/news/NewsFilters';
import { StatsBanner } from '@/components/features/news/StatsBanner';
import { NewsBreadcrumbs } from '@/components/features/news/NewsBreadcrumbs';
import { BackToTopFAB } from '@/components/features/news/BackToTopFAB';
import { NewsletterForm } from '@/components/features/news/NewsletterForm';
import { LoadMoreButton } from '@/components/features/news/LoadMoreButton';

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
    searchParams?: Promise<{ filter?: string; q?: string; category?: string; page?: string }>
}) {
    const searchParams = await props.searchParams;
    const filter = (searchParams?.filter || 'weekly') as TimeFilter;
    const searchQuery = searchParams?.q || '';
    const category = searchParams?.category || '';
    const page = parseInt(searchParams?.page || '1', 10);

    // Wrap in try-catch for error handling (Fix #9)
    let newsItems: Awaited<ReturnType<typeof NewsService.getAllNews>>['items'] = [];
    let total = 0;
    let hasMore = false;
    let stats = { totalAnalyzed: 0, importantStories: 0, lastUpdated: '' };
    let trendingNews: Awaited<ReturnType<typeof NewsService.getTrendingNews>> = [];
    let error: string | null = null;

    try {
        const newsResult = await NewsService.getAllNews({
            page,
            limit: 8,
            filter,
            category,
            search: searchQuery
        });
        newsItems = newsResult.items;
        total = newsResult.total;
        hasMore = newsResult.hasMore;

        stats = await NewsService.getNewsStats();
        trendingNews = await NewsService.getTrendingNews();
    } catch (e) {
        error = 'Failed to load news. Please try again later.';
        console.error('NewsPage error:', e);
    }

    return (
        <>
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

                {/* Error State */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6 text-destructive">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        {/* Filters - Wrapped in Suspense for useSearchParams */}
                        <Suspense fallback={<div className="h-14 bg-muted/30 rounded-lg animate-pulse mb-6" />}>
                            <NewsFilters />
                        </Suspense>

                        {/* Search/Filter Results Info */}
                        {(searchQuery || category) && (
                            <div className="mb-4 text-sm text-muted-foreground">
                                Found <span className="font-medium text-foreground">{total}</span> results
                                {searchQuery && <> for "<span className="font-medium text-foreground">{searchQuery}</span>"</>}
                                {category && <> in <span className="font-medium text-foreground capitalize">{category.replace(/-/g, ' ')}</span></>}
                            </div>
                        )}

                        {/* News Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {newsItems.map((item) => (
                                <div key={item.id} className="h-full">
                                    <NewsCard news={item} />
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {newsItems.length === 0 && !error && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p className="text-lg">No news found for this filter.</p>
                                <p className="text-sm mt-2">Try adjusting your search or filter criteria.</p>
                            </div>
                        )}

                        {/* Pagination - Load More (Fix #3) */}
                        {hasMore && (
                            <div className="mt-8 flex justify-center">
                                <Suspense fallback={<div className="h-10 w-32 bg-muted/30 rounded-lg animate-pulse" />}>
                                    <LoadMoreButton currentPage={page} />
                                </Suspense>
                            </div>
                        )}

                        {/* Pagination Info */}
                        {newsItems.length > 0 && (
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                Showing {newsItems.length} of {total} articles
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <NewsSidebar news={trendingNews} />

                        {/* Newsletter Form (Fix #4) */}
                        <Suspense fallback={<div className="h-48 bg-muted/30 rounded-xl animate-pulse" />}>
                            <NewsletterForm />
                        </Suspense>
                    </div>
                </div>
            </div>

            {/* Back to Top Button */}
            <BackToTopFAB />
        </>
    );
}
