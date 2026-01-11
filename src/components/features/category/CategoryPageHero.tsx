'use client';

import { Container } from '@/components/layout/Container';
import { formatToolCount } from '@/lib/utils/category-utils';

/**
 * Props for the CategoryPageHero component
 */
export interface CategoryPageHeroProps {
  totalTools: number;
  totalCategories: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * CategoryPageHero component displays the hero section for the category page.
 * Features a title, subtitle with statistics, and search input.
 * Uses purple-600 gradient background consistent with site theme.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export function CategoryPageHero({
  totalTools,
  totalCategories,
  searchQuery,
  onSearchChange,
}: CategoryPageHeroProps) {
  const formattedToolCount = formatToolCount(totalTools);
  const categoryLabel = totalCategories === 1 ? 'category' : 'categories';

  return (
    <div className="relative pt-16 pb-12 md:pt-20 md:pb-16 overflow-hidden">
      {/* Purple gradient background - consistent with site theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[400px] h-[400px] bg-purple-600 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[15%] w-[250px] h-[250px] bg-purple-400 rounded-full blur-[100px]" />
      </div>

      <Container className="relative z-10 flex flex-col items-center text-center">
        {/* Title - Requirement 2.1 */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 max-w-4xl text-gray-900">
          Explore <span className="text-purple-600">AI Tool Categories</span>
        </h1>

        {/* Subtitle with statistics - Requirement 2.2 */}
        <p className="text-base md:text-lg text-gray-500 mb-8 max-w-2xl">
          Browse {formattedToolCount} across {totalCategories} {categoryLabel} to find the perfect AI solution for your needs.
        </p>

        {/* Search input - Requirement 2.3 */}
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search categories..."
              className="block w-full pl-11 pr-4 py-3 
                         bg-white border border-gray-200 rounded-xl
                         text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                         transition-all duration-200
                         shadow-sm hover:shadow-md"
              aria-label="Search categories"
            />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default CategoryPageHero;
