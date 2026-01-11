import { cn } from '@/lib/utils';
import { CategoryBrowseSidebar } from './CategoryBrowseSidebar';
import { MobileCategoryAccordion } from './MobileCategoryAccordion';
import { CategorySection } from './CategoryBrowseSection';
import { Container } from '@/components/layout/Container';

/**
 * Subcategory data structure
 */
interface Subcategory {
    id: string;
    name: string;
    toolCount: number;
}

/**
 * Category with subcategories
 */
interface CategoryWithSubs {
    id: string;
    name: string;
    slug: string;
    toolCount: number;
    icon?: string;
    subcategories: Subcategory[];
}

/**
 * Props for CategoryBrowseLayout
 */
export interface CategoryBrowseLayoutProps {
    /** Categories with their subcategories */
    categories: CategoryWithSubs[];
    /** Total number of tools across all categories */
    totalTools?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * CategoryBrowseLayout Component
 * 
 * Main layout wrapper for the category browse page.
 * Implements 3-column responsive layout:
 * - Desktop (lg+): Sticky sidebar | Main content | (optional quick nav)
 * - Tablet/Mobile: Accordion + stacked content
 * 
 * Server component - no client-side JS for layout.
 */
export function CategoryBrowseLayout({
    categories,
    totalTools,
    className,
}: CategoryBrowseLayoutProps) {
    // Calculate total tools if not provided
    const calculatedTotalTools = totalTools ?? categories.reduce(
        (sum, cat) => sum + cat.toolCount,
        0
    );

    // Calculate total subcategories
    const totalSubcategories = categories.reduce(
        (sum, cat) => sum + cat.subcategories.length,
        0
    );

    return (
        <div className={cn('min-h-screen bg-[var(--background)]', className)}>
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
                <Container className="py-12 md:py-16">
                    <div className="max-w-3xl">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Find AI By Categories
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                            Browse over {totalSubcategories.toLocaleString()} subcategories across {categories.length} categories
                            with {calculatedTotalTools.toLocaleString()}+ AI tools.
                        </p>

                        {/* Quick stats */}
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {categories.length}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Categories
                                </span>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {totalSubcategories.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Subcategories
                                </span>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {calculatedTotalTools.toLocaleString()}+
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    AI Tools
                                </span>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Main Content Area */}
            <Container className="py-8 md:py-12">
                {/* Mobile Accordion - Visible on mobile/tablet */}
                <MobileCategoryAccordion categories={categories} />

                {/* Desktop Layout - 2 column with sticky sidebar */}
                <div className="flex gap-8">
                    {/* Left Sidebar - Hidden on mobile */}
                    <CategoryBrowseSidebar categories={categories} />

                    {/* Main Content - Category Sections */}
                    <main className="flex-1 min-w-0">
                        {/* Skip link target */}
                        <div id="main-content" tabIndex={-1} className="sr-only focus:not-sr-only">
                            Main content
                        </div>

                        {categories.length > 0 ? (
                            categories.map((category) => (
                                <CategorySection
                                    key={category.id}
                                    id={category.id}
                                    name={category.name}
                                    slug={category.slug}
                                    toolCount={category.toolCount}
                                    subcategories={category.subcategories}
                                />
                            ))
                        ) : (
                            /* Empty state */
                            <div className="py-16 text-center">
                                <div className="text-6xl mb-4">📂</div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No categories available
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Check back soon for AI tool categories.
                                </p>
                            </div>
                        )}
                    </main>
                </div>
            </Container>
        </div>
    );
}

export default CategoryBrowseLayout;
