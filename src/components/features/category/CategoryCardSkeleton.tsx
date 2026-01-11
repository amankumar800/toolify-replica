/**
 * CategoryCardSkeleton component displays a loading placeholder
 * that matches the dimensions of CategoryCard.
 * Uses pulse animation for visual feedback during loading.
 *
 * Requirements: 7.1
 */
export function CategoryCardSkeleton() {
  return (
    <div
      className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse"
      aria-hidden="true"
      role="presentation"
    >
      {/* Icon placeholder */}
      <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />

      {/* Name placeholder */}
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />

      {/* Tool count placeholder */}
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

export default CategoryCardSkeleton;
