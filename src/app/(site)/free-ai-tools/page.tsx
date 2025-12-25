import { Metadata } from 'next';
import Link from 'next/link';
import { freeAIToolsService } from '@/lib/services/free-ai-tools.service';
import {
  CategorySidebar,
  FeaturedToolsPanel,
  FAQAccordion,
  PrevNextNav,
  SearchToolsButton,
} from '@/components/features/free-ai-tools';

/**
 * Free AI Tools Main Page
 * 
 * Main landing page for the Free AI Tools section.
 * Implements Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 8.1, 8.3, 8.4, 8.5, 20.3, 21.3
 */

// ISR: Revalidate every 24 hours (86400 seconds) - Requirement 20.3
export const revalidate = 86400;

// Generate metadata for SEO - Requirements 2.9, 8.1, 8.3, 8.4, 21.3
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aitoolsbook.com';

  return {
    title: 'Find the Best Free AI Tools - AI Tools Book',
    description: 'Discover the best free AI tools across 22 categories. Compare free tiers, features, and pricing to find the perfect AI tool for your needs without breaking the bank.',
    keywords: ['free AI tools', 'AI tools directory', 'free AI software', 'AI chatbots', 'AI image generation', 'AI writing tools'],
    openGraph: {
      title: 'Find the Best Free AI Tools - AI Tools Book',
      description: 'Discover the best free AI tools across 22 categories. Compare free tiers, features, and pricing to find the perfect AI tool for your needs.',
      url: `${baseUrl}/free-ai-tools`,
      siteName: 'AI Tools Book',
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Find the Best Free AI Tools - AI Tools Book',
      description: 'Discover the best free AI tools across 22 categories.',
    },
    alternates: {
      canonical: `${baseUrl}/free-ai-tools`,
    },
  };
}

/**
 * Hero Section Component
 * Displays the main title, description, and CTAs - Requirements 2.2, 2.3, 12.1
 */
function HeroSection() {
  return (
    <section className="mb-10">
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
        Find the Best Free AI Tools
      </h1>
      <p className="text-lg text-[var(--muted-foreground)] mb-6 max-w-2xl">
        Discover powerful AI tools that won&apos;t cost you a dime. We&apos;ve curated the best free AI tools
        across 22 categories to help you work smarter, create faster, and achieve more.
      </p>

      {/* CTA Buttons - Requirements 2.3, 12.1 */}
      <div className="flex flex-wrap gap-4">
        <Link
          href="#categories"
          className="inline-flex items-center px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Browse Categories
        </Link>
        {/* Search Tools button focuses header search input - Requirement 12.1 */}
        <SearchToolsButton />
      </div>
    </section>
  );
}


/**
 * Why Use Section Component
 * Displays 3 benefit points - Requirement 2.4
 */
function WhyUseSection() {
  const benefits = [
    {
      icon: '🎯',
      title: 'Escape Free Trial Traps',
      description: 'No more surprise charges. Every tool we list has a genuine free tier you can use indefinitely.',
    },
    {
      icon: '🧭',
      title: 'End Information Overload',
      description: 'We\'ve done the research so you don\'t have to. Find the right tool in minutes, not hours.',
    },
    {
      icon: '✨',
      title: 'Create with Confidence',
      description: 'Detailed free tier info helps you understand exactly what you can do before you start.',
    },
  ];

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Why Use Our Free AI Tools Directory?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors"
          >
            <div className="text-3xl mb-4" aria-hidden="true">
              {benefit.icon}
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              {benefit.title}
            </h3>
            <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Three Steps Section Component
 * Displays numbered steps to find the perfect tool - Requirement 2.5
 */
function ThreeStepsSection() {
  const steps = [
    {
      number: 1,
      title: 'Define Your Need',
      description: 'Browse our 22 categories or use search to find tools that match your specific use case.',
    },
    {
      number: 2,
      title: 'Compare Free Plans',
      description: 'Review free tier details, limitations, and features to find the best fit for your workflow.',
    },
    {
      number: 3,
      title: 'Start Creating',
      description: 'Click through to your chosen tool and start using it immediately - no credit card required.',
    },
  ];

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Find Your Perfect Free AI Tool in 3 Steps
      </h2>
      <div className="flex flex-col md:flex-row gap-6">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex-1 bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100"
          >
            <div className="w-10 h-10 bg-[var(--primary)] text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
              {step.number}
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              {step.title}
            </h3>
            <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * FAQ Section Component
 * Displays FAQ accordion - Requirement 2.6
 */
function FAQSection({ faqItems }: { faqItems: { question: string; answer: string }[] }) {
  return (
    <section className="mb-10" id="faq">
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Free AI Tools: Frequently Asked Questions
      </h2>
      <FAQAccordion items={faqItems} />
    </section>
  );
}


/**
 * JSON-LD Structured Data Component
 * Generates structured data for SEO - Requirement 8.5
 */
function JsonLdScript({ categoriesCount, toolsCount }: { categoriesCount: number; toolsCount: number }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aitoolsbook.com';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Find the Best Free AI Tools',
    description: 'Discover the best free AI tools across 22 categories. Compare free tiers, features, and pricing.',
    url: `${baseUrl}/free-ai-tools`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categoriesCount,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Free AI Tools Directory',
          description: `Browse ${toolsCount}+ free AI tools across ${categoriesCount} categories`,
        },
      ],
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
 * Main Page Component
 * 
 * Three-column layout: Sidebar | Content | Featured Panel
 * Requirements: 2.1, 2.7, 2.8
 */
export default async function FreeAIToolsPage() {
  // Fetch data using the service
  const [categories, featuredTools, faqItems] = await Promise.all([
    freeAIToolsService.getCategories(),
    freeAIToolsService.getFeaturedTools(),
    freeAIToolsService.getFAQItems(),
  ]);

  // Calculate total tools count for structured data
  const totalTools = categories.reduce((sum, cat) => sum + cat.toolCount, 0);

  // Get first category for next navigation - Requirement 2.8
  const firstCategory = categories[0];

  return (
    <>
      {/* JSON-LD Structured Data - Requirement 8.5 */}
      <JsonLdScript categoriesCount={categories.length} toolsCount={totalTools} />

      <div className="container py-8">
        {/* Three-column layout - Requirement 2.1 */}
        <div className="flex gap-8">
          {/* Left Sidebar - Category Navigation - Requirement 2.1 */}
          <CategorySidebar categories={categories} />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Hero Section - Requirements 2.2, 2.3 */}
            <HeroSection />

            {/* Why Use Section - Requirement 2.4 */}
            <WhyUseSection />

            {/* 3 Steps Section - Requirement 2.5 */}
            <ThreeStepsSection />

            {/* FAQ Section - Requirement 2.6 */}
            <FAQSection faqItems={faqItems} />

            {/* Previous/Next Navigation - Requirement 2.8 */}
            <PrevNextNav
              previousPage={null}
              nextPage={firstCategory ? { name: firstCategory.name, slug: firstCategory.slug } : null}
            />
          </main>

          {/* Right Panel - Featured Tools - Requirement 2.7 */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-[calc(var(--header-height,64px)+1rem)]">
              <FeaturedToolsPanel tools={featuredTools} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
