import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { freeAIToolsService, FreeAIToolsError } from '@/lib/services/free-ai-tools.service';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import {
  CategorySidebar,
  OnThisPageNav,
  FreeAIToolListItem,
  PrevNextNav,
  BackToTop,
} from '@/components/features/free-ai-tools';
import { getSubcategorySectionId } from '@/lib/utils/free-ai-tools-utils';

/**
 * Free AI Tools Category Page
 * 
 * Dynamic category page for the Free AI Tools section.
 * Implements Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 8.2, 8.3, 8.4, 8.5, 20.3, 21.3, 21.5
 */

// ISR: Revalidate every 24 hours (86400 seconds) - Requirement 20.3
export const revalidate = 86400;

// Generate static params for all 22 categories - Requirement 20.3
export async function generateStaticParams() {
  try {
    const categories = await freeAIToolsService.getCategories();
    return categories.map((cat) => ({ slug: cat.slug }));
  } catch {
    // Return empty array if categories can't be loaded
    return [];
  }
}

// Generate metadata for SEO - Requirements 4.7, 8.2, 8.3, 8.4, 21.3
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://toolify.ai';
  
  try {
    const category = await freeAIToolsService.getCategoryBySlug(slug);
    
    const title = `Best Free AI Tools for ${category.name} in 2025 - Toolify`;
    const description = `Discover the best free AI tools for ${category.name}. ${category.description}`;
    
    return {
      title,
      description,
      keywords: [
        `free AI ${category.name.toLowerCase()}`,
        'free AI tools',
        category.name,
        ...category.subcategories.map(sub => sub.name),
      ],
      openGraph: {
        title,
        description,
        url: `${baseUrl}/free-ai-tools/${slug}`,
        siteName: 'Toolify',
        type: 'website',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: `${baseUrl}/free-ai-tools/${slug}`,
      },
    };
  } catch {
    return {
      title: 'Category Not Found - Toolify',
      description: 'The requested category could not be found.',
    };
  }
}


/**
 * JSON-LD Structured Data Component for Category Page
 * Generates CollectionPage structured data for SEO - Requirement 8.5
 */
function JsonLdScript({ 
  category, 
  baseUrl 
}: { 
  category: { 
    name: string; 
    slug: string; 
    description: string; 
    toolCount: number;
    subcategories: Array<{ name: string; tools: Array<{ name: string; slug: string }> }>;
  }; 
  baseUrl: string;
}) {
  // Flatten all tools for the ItemList
  const allTools = category.subcategories.flatMap(sub => sub.tools);
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Best Free AI Tools for ${category.name}`,
    description: category.description,
    url: `${baseUrl}/free-ai-tools/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: category.toolCount,
      itemListElement: allTools.slice(0, 50).map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: tool.name,
          url: `${baseUrl}/tool/${tool.slug}`,
        },
      })),
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Free AI Tools',
          item: `${baseUrl}/free-ai-tools`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.name,
          item: `${baseUrl}/free-ai-tools/${category.slug}`,
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * Empty Category State Component
 * Displays a helpful message when a category has no tools - Requirement 18.3
 * Also handles flat list display for categories with no subcategories - Requirement 18.4
 */
function EmptyCategoryState({ categoryName }: { categoryName: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto max-w-md">
        {/* Empty state icon */}
        <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--muted-foreground)]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        
        {/* Empty state message - Requirement 18.3 */}
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          No tools available yet
        </h3>
        <p className="text-[var(--muted-foreground)] mb-6">
          We&apos;re still gathering free AI tools for {categoryName}. 
          Check back soon or explore other categories.
        </p>
        
        {/* Helpful links */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/free-ai-tools"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary)]/90 transition-colors"
          >
            Browse All Categories
          </a>
          <a
            href="/submit"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Submit a Tool
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Subcategory Section Component
 * Displays tools grouped by subcategory with H3 headings - Requirements 4.2, 4.3
 */
function SubcategorySection({ 
  subcategory 
}: { 
  subcategory: { 
    id: string; 
    name: string; 
    toolCount: number; 
    tools: Array<{ 
      id: string; 
      name: string; 
      slug: string; 
      externalUrl: string | null; 
      description: string; 
      freeTierDetails: string | null; 
      pricing: string | null; 
      categoryIds: string[];
    }>;
  };
}) {
  const sectionId = getSubcategorySectionId(subcategory);
  
  // Filter out invalid tools - Requirement 5.5
  const validTools = subcategory.tools.filter(tool => 
    tool && typeof tool.id === 'string' && typeof tool.slug === 'string'
  );
  
  return (
    <section id={sectionId} className="mb-8 scroll-mt-24">
      {/* H3 heading prefixed with "Free AI" - Requirement 4.2 */}
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">
        {subcategory.name}
      </h3>
      
      {/* Tool list items (not cards) - Requirement 4.3 */}
      {validTools.length > 0 ? (
        <ul className="divide-y divide-[var(--border)]" role="list">
          {validTools.map((tool) => (
            <FreeAIToolListItem key={tool.id} tool={tool} />
          ))}
        </ul>
      ) : (
        // Empty subcategory state - Requirement 18.3
        <div className="py-4 px-4 bg-[var(--muted)]/30 rounded-md">
          <p className="text-[var(--muted-foreground)] text-sm">
            No tools available in this subcategory yet.
          </p>
        </div>
      )}
    </section>
  );
}


/**
 * Main Category Page Component
 * 
 * Three-column layout: Sidebar | Content | On This Page Nav
 * Requirements: 4.1, 4.4, 4.5, 4.6, 21.5
 */
export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://toolify.ai';
  
  // Fetch category data and categories list
  let category;
  let categories;
  
  try {
    [category, categories] = await Promise.all([
      freeAIToolsService.getCategoryBySlug(slug),
      freeAIToolsService.getCategories(),
    ]);
  } catch (error) {
    // Handle not found errors
    if (error instanceof FreeAIToolsError && error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  // Breadcrumb items - Requirement 21.5
  const breadcrumbItems = [
    { label: 'Free AI Tools', href: '/free-ai-tools' },
    { label: category.name }, // Current page - not linked
  ];

  return (
    <>
      {/* JSON-LD Structured Data - Requirement 8.5 */}
      <JsonLdScript category={category} baseUrl={baseUrl} />

      <div className="container py-8">
        {/* Three-column layout - Requirement 4.4 */}
        <div className="flex gap-8">
          {/* Left Sidebar - Category Navigation - Requirement 4.4 */}
          <CategorySidebar categories={categories} activeSlug={slug} />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumb Navigation - Requirement 21.5 */}
            <Breadcrumb items={breadcrumbItems} />

            {/* Category Title and Description - Requirement 4.1 */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
                {category.name}
              </h1>
              <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
                {category.description}
              </p>
            </header>

            {/* Subcategory Sections - Requirements 4.2, 4.3, 18.3, 18.4 */}
            {category.subcategories.length > 0 ? (
              category.subcategories.map((subcategory) => (
                <SubcategorySection key={subcategory.id} subcategory={subcategory} />
              ))
            ) : (
              // Empty state for categories with no tools - Requirement 18.3
              // Flat list display for categories with no subcategories - Requirement 18.4
              <EmptyCategoryState categoryName={category.name} />
            )}

            {/* Previous/Next Navigation - Requirement 4.5 */}
            <PrevNextNav
              previousPage={category.previousCategory}
              nextPage={category.nextCategory}
            />
          </main>

          {/* Right Panel - On This Page Nav - Requirement 4.6 */}
          <OnThisPageNav subcategories={category.subcategories} />
        </div>
      </div>

      {/* Back to Top Button - Requirement 20.6 */}
      <BackToTop />
    </>
  );
}
