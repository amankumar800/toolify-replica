'use client';

import { useState, useMemo } from 'react';
import { Container } from '@/components/layout/Container';
import { CategoryPageHero } from './CategoryPageHero';
import { CategoryGrid, CategoryGridItem } from './CategoryGrid';
import { filterCategoriesBySearch } from '@/lib/utils/category-utils';

/**
 * Props for the CategoryPageClient component
 */
export interface CategoryPageClientProps {
  categories: CategoryGridItem[];
  totalTools: number;
}

/**
 * Empty state component displayed when no categories match the search
 * Requirement 5.3: Display "No categories found" when search yields no results
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4" role="img" aria-hidden="true">
        🔍
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No categories found
      </h2>
      <p className="text-gray-500 max-w-md">
        Try adjusting your search term or browse all categories by clearing the search.
      </p>
    </div>
  );
}

/**
 * CategoryPageClient component manages the client-side state and interactivity
 * for the category page. Handles search filtering in real-time.
 *
 * Responsibilities:
 * - Manage search query state
 * - Filter categories based on search term (case-insensitive)
 * - Render hero, grid, and empty state components
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function CategoryPageClient({
  categories,
  totalTools,
}: CategoryPageClientProps) {
  // Search query state - Requirement 5.1
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search - Requirements 5.2, 5.4
  // useMemo for performance optimization
  const filteredCategories = useMemo(() => {
    // Cast to the expected type for filterCategoriesBySearch
    return filterCategoriesBySearch(
      categories as Parameters<typeof filterCategoriesBySearch>[0],
      searchQuery
    ) as CategoryGridItem[];
  }, [categories, searchQuery]);

  // Handler for search input changes - Requirement 5.1
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div>
      {/* Hero section with search */}
      <CategoryPageHero
        totalTools={totalTools}
        totalCategories={categories.length}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Category grid or empty state */}
      <Container className="py-12">
        {filteredCategories.length > 0 ? (
          <CategoryGrid categories={filteredCategories} />
        ) : (
          <EmptyState />
        )}
      </Container>
    </div>
  );
}

export default CategoryPageClient;
