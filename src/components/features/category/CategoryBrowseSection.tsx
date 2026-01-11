import { cn } from '@/lib/utils';
import { SubcategoryCard } from './SubcategoryCard';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

/**
 * Subcategory data structure
 */
interface Subcategory {
    id: string;
    name: string;
    toolCount: number;
}

/**
 * Props for CategorySection component
 */
export interface CategorySectionProps {
    /** Category ID for section anchor */
    id: string;
    /** Category name for the heading */
    name: string;
    /** Category slug for subcategory links */
    slug: string;
    /** Total tool count for this category */
    toolCount: number;
    /** Subcategories to display in grid */
    subcategories: Subcategory[];
    /** Additional CSS classes */
    className?: string;
}

/**
 * CategorySection Component
 * 
 * Server component that renders a main category section with:
 * - H2 heading with category icon
 * - Tool count badge
 * - Responsive grid of SubcategoryCards (3-col desktop, 2-col tablet, 1-col mobile)
 * 
 * Uses scroll-margin-top for proper anchor offset under sticky header.
 */
export function CategorySection({
    id,
    name,
    slug,
    toolCount,
    subcategories,
    className,
}: CategorySectionProps) {
    // Generate section ID for scroll targeting
    const sectionId = `category-${id}`;

    return (
        <section
            id={sectionId}
            className={cn(
                'mb-12',
                // Scroll offset for sticky header
                'scroll-mt-[calc(var(--header-height,64px)+1.5rem)]',
                className
            )}
            aria-labelledby={`${sectionId}-heading`}
        >
            {/* Category Header */}
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    {/* Category Icon */}
                    <CategoryIcon
                        slug={slug}
                        size="md"
                        className="flex-shrink-0"
                    />

                    {/* Category Name */}
                    <h2
                        id={`${sectionId}-heading`}
                        className={cn(
                            'text-xl md:text-2xl font-bold',
                            'text-gray-900 dark:text-white'
                        )}
                    >
                        {name}
                    </h2>

                    {/* Tool Count Badge */}
                    <span
                        className={cn(
                            'text-sm font-medium',
                            'text-gray-500 dark:text-gray-400',
                            'bg-gray-100 dark:bg-gray-800',
                            'px-2.5 py-1 rounded-full'
                        )}
                        aria-label={`${toolCount} total tools`}
                    >
                        {toolCount.toLocaleString()} tools
                    </span>
                </div>

                {/* Decorative gradient underline */}
                <div
                    className={cn(
                        'h-0.5 w-16',
                        'bg-gradient-to-r from-purple-500 to-purple-300',
                        'rounded-full'
                    )}
                    aria-hidden="true"
                />
            </header>

            {/* Subcategory Grid */}
            {subcategories.length > 0 ? (
                <div
                    className={cn(
                        'grid gap-4',
                        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    )}
                    role="list"
                    aria-label={`${name} subcategories`}
                >
                    {subcategories.map((subcategory) => (
                        <div key={subcategory.id} role="listitem">
                            <SubcategoryCard
                                name={subcategory.name}
                                toolCount={subcategory.toolCount}
                                categorySlug={slug}
                                subcategoryId={subcategory.id}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty state */
                <div
                    className={cn(
                        'py-8 px-6 text-center',
                        'bg-gray-50 dark:bg-gray-800/50',
                        'rounded-xl border border-dashed border-gray-200 dark:border-gray-700'
                    )}
                >
                    <p className="text-gray-500 dark:text-gray-400">
                        No subcategories available yet.
                    </p>
                </div>
            )}
        </section>
    );
}

export default CategorySection;
