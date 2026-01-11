import { cn } from '@/lib/utils';
import { Container } from '@/components/layout/Container';

/**
 * Skeleton shimmer component
 */
function Shimmer({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
                className
            )}
        />
    );
}

/**
 * Skeleton for SubcategoryCard
 */
function SubcategoryCardSkeleton() {
    return (
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between">
                <Shimmer className="h-5 w-32" />
                <Shimmer className="h-5 w-10 rounded-full" />
            </div>
        </div>
    );
}

/**
 * Skeleton for CategorySection
 */
function CategorySectionSkeleton() {
    return (
        <div className="mb-12">
            {/* Header skeleton */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Shimmer className="h-8 w-8 rounded-lg" />
                    <Shimmer className="h-7 w-48" />
                    <Shimmer className="h-6 w-16 rounded-full" />
                </div>
                <Shimmer className="h-0.5 w-16 rounded-full" />
            </div>

            {/* Grid skeleton */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SubcategoryCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton for Sidebar Item
 */
function SidebarItemSkeleton() {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <Shimmer className="h-5 w-5 rounded" />
            <Shimmer className="h-4 w-24 flex-1" />
            <Shimmer className="h-4 w-6 rounded-full" />
        </div>
    );
}

/**
 * CategoryBrowseSkeleton Component
 * 
 * Loading skeleton for the category browse page.
 * Prevents Cumulative Layout Shift (CLS) by matching real content dimensions.
 */
export function CategoryBrowseSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Hero Section Skeleton */}
            <section className="bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
                <Container className="py-12 md:py-16">
                    <div className="max-w-3xl">
                        <Shimmer className="h-12 w-80 mb-4" />
                        <Shimmer className="h-6 w-full max-w-xl mb-2" />
                        <Shimmer className="h-6 w-3/4 mb-6" />

                        {/* Stats skeleton */}
                        <div className="flex flex-wrap gap-4">
                            <Shimmer className="h-12 w-32 rounded-full" />
                            <Shimmer className="h-12 w-40 rounded-full" />
                            <Shimmer className="h-12 w-36 rounded-full" />
                        </div>
                    </div>
                </Container>
            </section>

            {/* Main Content Skeleton */}
            <Container className="py-8 md:py-12">
                {/* Mobile Accordion Skeleton */}
                <div className="lg:hidden mb-8">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                <div className="flex items-center gap-3">
                                    <Shimmer className="h-5 w-5 rounded" />
                                    <Shimmer className="h-5 w-32" />
                                    <Shimmer className="h-4 w-8 rounded-full" />
                                </div>
                                <Shimmer className="h-5 w-5 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop Layout Skeleton */}
                <div className="flex gap-8">
                    {/* Sidebar Skeleton - Hidden on mobile */}
                    <aside className="hidden lg:block w-60 flex-shrink-0">
                        <div className="sticky top-[calc(var(--header-height,64px)+1rem)]">
                            <div className="flex flex-col gap-1 pr-4">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <SidebarItemSkeleton key={i} />
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Skeleton */}
                    <main className="flex-1 min-w-0">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <CategorySectionSkeleton key={i} />
                        ))}
                    </main>
                </div>
            </Container>
        </div>
    );
}

export default CategoryBrowseSkeleton;
