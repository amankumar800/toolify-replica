import newsData from '@/data/ai-news.json';

export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface NewsItem {
    id: string;
    slug: string;
    title: string;
    priorityScore: number;
    sourceCount: number;
    summary: string;
    content: string;
    date: string;
    author: {
        name: string;
        avatar?: string;
    };
    image?: string;
    tags: string[];
    source?: {
        name: string;
        url: string;
    };
    stats: {
        views: number;
        likes: number;
    };
}

export interface NewsStats {
    totalAnalyzed: number;
    importantStories: number;
    lastUpdated: string;
}

export const NewsService = {
    getAllNews: async (
        page = 1,
        limit = 10,
        filter: TimeFilter = 'daily'
    ): Promise<{ items: NewsItem[]; total: number }> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        const now = new Date();
        const cutoffDate = new Date();

        switch (filter) {
            case 'daily':
                cutoffDate.setDate(now.getDate() - 1);
                break;
            case 'weekly':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case 'monthly':
                cutoffDate.setMonth(now.getMonth() - 1);
                break;
            case 'yearly':
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        // Filter by date and sort by date descending
        const filtered = (newsData as NewsItem[])
            .filter(n => new Date(n.date) >= cutoffDate)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const startIndex = (page - 1) * limit;
        const items = filtered.slice(startIndex, startIndex + limit);

        return {
            items,
            total: filtered.length
        };
    },

    getTrendingNews: async (limit = 5): Promise<NewsItem[]> => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Sort by priority score (highest first), then by views
        const trending = [...(newsData as NewsItem[])].sort((a, b) => {
            if (b.priorityScore !== a.priorityScore) {
                return b.priorityScore - a.priorityScore;
            }
            return (b.stats.views + b.stats.likes) - (a.stats.views + a.stats.likes);
        });

        return trending.slice(0, limit);
    },

    getNewsBySlug: async (slug: string): Promise<NewsItem | null> => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const item = (newsData as NewsItem[]).find((n) => n.slug === slug);
        return item || null;
    },

    getRelatedNews: async (currentSlug: string, limit = 3): Promise<NewsItem[]> => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const currentItem = (newsData as NewsItem[]).find(n => n.slug === currentSlug);

        let related = (newsData as NewsItem[]).filter(n => n.slug !== currentSlug);

        if (currentItem) {
            // Prioritize same tags
            related = related.sort((a, b) => {
                const aMatches = a.tags.filter(t => currentItem.tags.includes(t)).length;
                const bMatches = b.tags.filter(t => currentItem.tags.includes(t)).length;
                return bMatches - aMatches;
            });
        }

        return related.slice(0, limit);
    },

    getNewsStats: async (): Promise<NewsStats> => {
        await new Promise((resolve) => setTimeout(resolve, 50));

        const all = newsData as NewsItem[];
        const important = all.filter(n => n.priorityScore >= 5.5);

        return {
            totalAnalyzed: all.length,
            importantStories: important.length,
            lastUpdated: new Date().toISOString()
        };
    },

    searchNews: async (query: string): Promise<NewsItem[]> => {
        await new Promise((resolve) => setTimeout(resolve, 50));

        const lowerQuery = query.toLowerCase();
        return (newsData as NewsItem[]).filter(n =>
            n.title.toLowerCase().includes(lowerQuery) ||
            n.summary.toLowerCase().includes(lowerQuery) ||
            n.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }
};
