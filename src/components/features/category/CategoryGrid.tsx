'use client';

import { CategoryCard, CategoryCardProps } from './CategoryCard';

/**
 * Category type for the grid
 */
export type CategoryGridItem = CategoryCardProps['category'];

/**
 * Props for the CategoryGrid component
 */
export interface CategoryGridProps {
  categories: CategoryGridItem[];
}

/**
 * CategoryGrid component displays a responsive grid of category cards.
 * 
 * Responsive breakpoints:
 * - ≥1024px: 4 columns
 * - 768-1023px: 3 columns
 * - <768px: 2 columns
 * 
 * Gap: 24px (gap-6 in Tailwind)
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      role="list"
      aria-label="Category grid"
    >
      {categories.map((category) => (
        <div key={category.id} role="listitem">
          <CategoryCard category={category} />
        </div>
      ))}
    </div>
  );
}

export default CategoryGrid;
