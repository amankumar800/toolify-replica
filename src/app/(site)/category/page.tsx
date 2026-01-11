import { Metadata } from 'next';
import Script from 'next/script';
import { CategoryPageClient } from '@/components/features/category/CategoryPageClient';
import { getCategories } from '@/lib/services/categories.service';
import { isValidCategory } from '@/lib/utils/category-utils';

// ISR revalidation - cache for 1 hour (Requirement 7.2)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Explore AI Tool Categories | AI Tools Book',
  description:
    'Browse all AI tools by category. Find the best AI software for Chatbots, Image Generation, Coding, Video, Music, and more.',
  alternates: {
    canonical: 'https://aitoolsbook.com/category',
  },
  openGraph: {
    title: 'Explore AI Tool Categories | AI Tools Book',
    description: 'Browse all AI tools by category.',
    url: 'https://aitoolsbook.com/category',
    siteName: 'AI Tools Book',
    locale: 'en_US',
    type: 'website',
  },
};

/**
 * Category page server component
 * Fetches categories from Supabase, filters invalid/test data, and renders the page.
 *
 * Requirements:
 * - 1.1: Display only categories where toolCount > 0
 * - 1.2: Filter out test data categories
 * - 7.2: ISR with 3600s revalidation
 * - 7.3: Single database query for categories
 */
export default async function CategoryPage() {
  // Single query to fetch categories with tool counts (Requirement 7.3)
  const allCategories = await getCategories({ withToolCount: true });

  // Server-side filtering - remove test data and zero-count categories (Requirements 1.1, 1.2)
  const filteredCategories = allCategories.filter(isValidCategory);

  // Transform to CategoryGridItem format expected by CategoryPageClient
  const categoryItems = filteredCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    toolCount: cat.toolCount ?? cat.count ?? 0,
    icon: undefined, // Categories use default icon in CategoryCard
  }));

  // Calculate total tools from filtered categories
  const totalTools = categoryItems.reduce((sum, cat) => sum + cat.toolCount, 0);

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
        description:
          'Comprehensive directory of AI tools categorized by function.',
        url: 'https://aitoolsbook.com/category',
        about: {
          '@type': 'Thing',
          name: 'Artificial Intelligence Software',
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-toolify-bg">
      <CategoryPageClient categories={categoryItems} totalTools={totalTools} />

      <Script
        id="category-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
