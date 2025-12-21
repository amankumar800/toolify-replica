import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CategoryItem } from '@/lib/types/home.types';

interface CategoryGridProps {
    /** Array of categories to display */
    categories: CategoryItem[];
}

/**
 * Category Grid - Displays categories with emojis and tool counts
 * 
 * Fixes applied:
 * - #7: Focus-visible styles
 * - #14, #39: Removed non-functional carousel arrow
 * - #22: Props-based data pattern
 * - #24: Shared types
 * - #36: Empty state
 * - #42: Touch-friendly padding (p-6 for 48px+ targets)
 * - #52: Emoji with proper aria-hidden
 */
export function CategoryGrid({ categories }: CategoryGridProps) {
    // Issue #36: Empty state
    if (!categories || categories.length === 0) {
        return (
            <section className="py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Free AI Tools by Category
                </h2>
                <div className="text-center py-8">
                    <p className="text-gray-500">No categories available</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-12">
            {/* Section Header */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Free AI Tools by Category
            </h2>

            {/* Grid - Issue #14, #39: Removed non-functional carousel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/free-ai-tools/${category.slug}`}
                        className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none touch-target"
                        aria-label={`${category.name} - ${category.toolCount.toLocaleString()} tools`}
                    >
                        {/* Icon - Issue #52: aria-hidden for decorative emoji */}
                        <div className="text-3xl mb-3" aria-hidden="true">
                            {category.icon}
                        </div>

                        {/* Name */}
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                            {category.name}
                        </h3>

                        {/* Tool Count */}
                        <p className="text-sm text-[var(--primary)]">
                            {category.toolCount.toLocaleString()} tools
                        </p>
                    </Link>
                ))}
            </div>

            {/* All Free AI Tools Button */}
            <div className="flex justify-center mt-8">
                <Link
                    href="/free-ai-tools"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-full font-medium text-sm hover:opacity-90 transition-all shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none touch-target"
                >
                    All Free AI Tools
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
            </div>
        </section>
    );
}
