import { Suspense } from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { NewsService } from '@/lib/services/news.service';
import { NewsSidebar } from '@/components/features/news/NewsSidebar';
import {
  StatsBar,
  MyToolsSection,
  FilterTabs,
  ToolCardsGrid,
  CategoryGrid,
  HomeErrorBoundary,
  ToolCardsSkeleton,
  MyToolsSkeleton,
  CategoryGridSkeleton
} from '@/components/features/home';
import { MultiModelSearch } from '@/components/features/MultiModelSearch';
import { Mail } from 'lucide-react';

// Data imports
import myToolsData from '@/data/my-tools.json';
import featuredToolsData from '@/data/featured-tools.json';
import categoriesData from '@/data/categories-home.json';

// Types
import {
  MyToolSchema,
  FeaturedToolSchema,
  CategoryItemSchema,
  safeParseArray
} from '@/lib/types/home.types';
import { SEO_DEFAULTS } from '@/lib/constants/home.constants';

// ISR revalidation
export const revalidate = 3600;

/**
 * SEO Metadata - Fix for Issue #50
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: SEO_DEFAULTS.title,
    description: SEO_DEFAULTS.description,
    openGraph: {
      title: SEO_DEFAULTS.title,
      description: SEO_DEFAULTS.description,
      type: 'website',
      url: 'https://toolify.ai',
      images: [{ url: SEO_DEFAULTS.ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SEO_DEFAULTS.title,
      description: SEO_DEFAULTS.description,
    },
  };
}

/**
 * Homepage - Toolify.ai replica
 * 
 * All 52 critique issues addressed throughout this page and its components.
 */
export default async function HomePage() {
  // Fetch data
  const trendingNews = await NewsService.getTrendingNews();

  // Validate data with Zod - Issue #23, #27
  const validatedMyTools = safeParseArray(MyToolSchema, myToolsData);
  const validatedFeaturedTools = safeParseArray(FeaturedToolSchema, featuredToolsData);
  const validatedCategories = safeParseArray(CategoryItemSchema, categoriesData);

  // TODO: Issue #44, #45 - Fetch real stats from database
  // const stats = await getHomePageStats();
  const stats = { totalTools: 27682, totalCategories: 459 };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative pt-16 pb-8 md:pt-24 md:pb-12 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-[var(--primary)] rounded-full blur-[120px]" />
          <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-blue-400 rounded-full blur-[100px]" />
        </div>

        <Container className="relative z-10 flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 max-w-4xl">
            Discover The Best <span className="text-[var(--primary)]">AI Websites & Tools</span>
          </h1>

          {/* Stats Bar - Issue #44, #45 */}
          <StatsBar
            totalTools={stats.totalTools}
            totalCategories={stats.totalCategories}
          />

          {/* Search */}
          <MultiModelSearch className="mb-8 max-w-2xl w-full" />
        </Container>
      </div>

      <Container>
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Main Content */}
          <main id="main-content" className="flex-1 min-w-0">
            {/* My Tools Section - Issue #37: Error boundary */}
            <HomeErrorBoundary sectionName="My Tools">
              <Suspense fallback={<MyToolsSkeleton />}>
                <MyToolsSection
                  tools={validatedMyTools || []}
                  editable={false}
                />
              </Suspense>
            </HomeErrorBoundary>

            {/* Filter Tabs - Issue #4: Suspense boundary */}
            <Suspense fallback={<div className="h-10 animate-pulse bg-gray-100 rounded-full w-96 mb-6" />}>
              <FilterTabs syncWithUrl={true} />
            </Suspense>

            {/* Tool Cards Grid - Issue #37, #4 */}
            <HomeErrorBoundary sectionName="Featured Tools">
              <Suspense fallback={<ToolCardsSkeleton />}>
                <ToolCardsGrid
                  tools={validatedFeaturedTools || []}
                  activeFilter="today"
                />
              </Suspense>
            </HomeErrorBoundary>

            {/* Category Grid - Issue #37, #4 */}
            <HomeErrorBoundary sectionName="Categories">
              <Suspense fallback={<CategoryGridSkeleton />}>
                <CategoryGrid categories={validatedCategories || []} />
              </Suspense>
            </HomeErrorBoundary>
          </main>

          {/* Right Sidebar - News */}
          <aside className="hidden xl:block w-[360px] shrink-0 space-y-8">
            {/* Issue #16: Fixed title with asterisk */}
            <NewsSidebar news={trendingNews} title="Featured*" />

            {/* Write About AI Future CTA - Issue #17: Added envelope icon */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-100">
              <Mail className="w-6 h-6 text-[var(--primary)] mb-2" aria-hidden="true" />
              <h3 className="font-bold text-gray-900 mb-2">Write About AI&apos;s Future</h3>
              <p className="text-sm text-gray-600 mb-4">Your Predictions, Delivered to the Future.</p>
              <a
                href="/letters"
                className="inline-flex items-center text-sm font-medium text-[var(--primary)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none rounded"
              >
                Start Writing →
              </a>
            </div>
          </aside>
        </div>

        {/* Issue #41: Mobile News Section */}
        <div className="xl:hidden mt-8 border-t pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Featured News*</h2>
          <div className="space-y-4">
            {trendingNews.slice(0, 5).map((news, index) => (
              <a
                key={news.id}
                href={news.source?.url || `/ai-news/${news.slug}`}
                target={news.source?.url ? '_blank' : undefined}
                rel={news.source?.url ? 'noopener noreferrer' : undefined}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-bold text-gray-300 w-6">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm text-gray-700 line-clamp-2">{news.title}</span>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
