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
        <div className={cn('min-h-screen bg-white dark:bg-gray-950', className)}>
            {/* ========== PREMIUM HERO SECTION ========== */}
            <section className="relative overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 category-hero-gradient" aria-hidden="true" />

                {/* Floating gradient orbs */}
                <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                    <div className="category-orb category-orb-1 w-[500px] h-[500px] bg-purple-500/30 -top-20 -left-20" />
                    <div className="category-orb category-orb-2 w-[400px] h-[400px] bg-indigo-500/25 top-1/2 -right-32" />
                    <div className="category-orb category-orb-1 w-[300px] h-[300px] bg-violet-500/20 -bottom-20 left-1/3" />
                </div>

                {/* Hero content */}
                <Container className="relative z-10 py-16 md:py-20 lg:py-24">
                    <div className="max-w-3xl">
                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                            Find AI By{' '}
                            <span className="category-gradient-text">Categories</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg text-purple-100/80 mb-8 max-w-2xl">
                            Browse over {totalSubcategories.toLocaleString()} subcategories across{' '}
                            {categories.length} categories with {calculatedTotalTools.toLocaleString()}+ AI tools.
                        </p>

                        {/* Glassmorphism stats */}
                        <div className="flex flex-wrap gap-3">
                            <div className="category-glass rounded-full px-5 py-2.5 flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">{categories.length}</span>
                                <span className="text-sm text-purple-200/70">Categories</span>
                            </div>
                            <div className="category-glass rounded-full px-5 py-2.5 flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">{totalSubcategories.toLocaleString()}</span>
                                <span className="text-sm text-purple-200/70">Subcategories</span>
                            </div>
                            <div className="category-glass rounded-full px-5 py-2.5 flex items-center gap-2">
                                <span className="text-2xl font-bold text-white">{calculatedTotalTools.toLocaleString()}+</span>
                                <span className="text-sm text-purple-200/70">AI Tools</span>
                            </div>
                        </div>
                    </div>
                </Container>

                {/* Bottom fade to content */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent"
                    aria-hidden="true"
                />
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
