import { Metadata } from 'next';
import { Suspense } from 'react';
import Script from 'next/script';
import { freeAIToolsService } from '@/lib/services/free-ai-tools.service';
import { CategoryBrowseLayout } from '@/components/features/category/CategoryBrowseLayout';
import { CategoryBrowseSkeleton } from '@/components/features/category/CategoryBrowseSkeleton';

// ISR revalidation - cache for 1 hour
export const revalidate = 3600;

// Force dynamic rendering since we use cookies() via Supabase client
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Find AI By Categories | AI Tools Book',
  description:
    'Browse all AI tools by category. Explore 22+ categories with hundreds of subcategories covering Chatbots, Image Generation, Coding, Video, Music, and more.',
  alternates: {
    canonical: 'https://aitoolsbook.com/category',
  },
  openGraph: {
    title: 'Find AI By Categories | AI Tools Book',
    description: 'Browse all AI tools by category. Find the best AI software for your needs.',
    url: 'https://aitoolsbook.com/category',
    siteName: 'AI Tools Book',
    locale: 'en_US',
    type: 'website',
  },
};

/**
 * Fetches all categories with their subcategories
 * Uses the free-ai-tools service for data access
 */
async function getCategoriesWithSubcategories() {
  const categories = await freeAIToolsService.getCategories();

  // Fetch subcategories for each category in parallel
  const categoriesWithSubs = await Promise.all(
    categories.map(async (category) => {
      try {
        const categoryData = await freeAIToolsService.getCategoryBySlug(category.slug);
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          toolCount: category.toolCount,
          icon: category.icon,
          subcategories: categoryData.subcategories.map(sub => ({
            id: sub.id,
            name: sub.name,
            toolCount: sub.toolCount,
          })),
        };
      } catch {
        // If a category fails, return it with empty subcategories
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          toolCount: category.toolCount,
          icon: category.icon,
          subcategories: [],
        };
      }
    })
  );

  return categoriesWithSubs;
}

/**
 * Category Browse Page
 * 
 * Main category listing page with:
 * - Hero section with stats
 * - Sticky sidebar navigation (desktop)
 * - Mobile accordion navigation
 * - Category sections with subcategory grids
 * 
 * Uses ISR with 1-hour revalidation for performance.
 */
export default async function CategoryPage() {
  const categories = await getCategoriesWithSubcategories();

  // Calculate totals for structured data
  const totalTools = categories.reduce((sum, cat) => sum + cat.toolCount, 0);
  const totalSubcategories = categories.reduce((sum, cat) => sum + cat.subcategories.length, 0);

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://aitoolsbook.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Categories',
            item: 'https://aitoolsbook.com/category',
          },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: 'AI Tool Categories',
        description: `Comprehensive directory of AI tools across ${categories.length} categories and ${totalSubcategories} subcategories.`,
        url: 'https://aitoolsbook.com/category',
        about: {
          '@type': 'Thing',
          name: 'Artificial Intelligence Software',
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: categories.length,
          itemListElement: categories.slice(0, 22).map((cat, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: cat.name,
            url: `https://aitoolsbook.com/free-ai-tools/${cat.slug}`,
          })),
        },
      },
    ],
  };

  return (
    <>
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md"
      >
        Skip to main content
      </a>

      <main>
        <Suspense fallback={<CategoryBrowseSkeleton />}>
          <CategoryBrowseLayout
            categories={categories}
            totalTools={totalTools}
          />
        </Suspense>
      </main>

      <Script
        id="category-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
