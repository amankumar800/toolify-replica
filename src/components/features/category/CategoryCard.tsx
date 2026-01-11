'use client';

import Link from 'next/link';
import { formatToolCount, generateCategoryLink } from '@/lib/utils/category-utils';

/**
 * Props for the CategoryCard component
 */
export interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    toolCount: number;
    icon?: string;
  };
}

/**
 * CategoryCard component displays a single category with icon, name, and tool count.
 * Features hover effects with shadow and scale transformation.
 * Links to the category detail page.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export function CategoryCard({ category }: CategoryCardProps) {
  const { name, slug, toolCount, icon } = category;
  const categoryLink = generateCategoryLink(slug);
  const formattedCount = formatToolCount(toolCount);

  // Default icon if none provided
  const displayIcon = icon || '📁';

  return (
    <Link
      href={categoryLink}
      className="group block bg-white rounded-xl p-6 border border-gray-200 
                 hover:shadow-lg hover:scale-[1.02] hover:border-purple-300
                 transition-all duration-200 ease-out
                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      aria-label={`${name} - ${formattedCount}`}
    >
      {/* Icon/Emoji - prominent position */}
      <div className="text-4xl mb-4" role="img" aria-hidden="true">
        {displayIcon}
      </div>

      {/* Category name - bold text */}
      <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-200">
        {name}
      </h3>

      {/* Tool count - formatted with thousands separators */}
      <p className="text-sm text-gray-500">
        {formattedCount}
      </p>
    </Link>
  );
}

export default CategoryCard;
