/**
 * Skeleton loader for tool cards grid
 * Fix for Issue #35: Loading states
 */
export function ToolCardsSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                    {/* Icon skeleton */}
                    <div className="w-10 h-10 rounded-lg bg-gray-200 mb-3" />
                    {/* Title skeleton */}
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    {/* Description skeleton */}
                    <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton loader for My Tools section
 */
export function MyToolsSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 animate-pulse">
            <div className="flex items-center justify-between mb-6">
                <div className="h-6 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded w-12" />
            </div>
            <div className="flex items-center justify-center gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-gray-200" />
                        <div className="h-3 bg-gray-100 rounded w-12" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton loader for Category Grid
 */
export function CategoryGridSkeleton() {
    return (
        <section className="py-12 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-xl p-6">
                        <div className="w-8 h-8 bg-gray-200 rounded mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                ))}
            </div>
        </section>
    );
}

/**
 * Combined skeleton for entire homepage
 */
export function HomePageSkeleton() {
    return (
        <div className="animate-pulse">
            <MyToolsSkeleton />
            {/* Filter tabs skeleton */}
            <div className="flex gap-2 mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 w-24 bg-gray-100 rounded-full" />
                ))}
            </div>
            <ToolCardsSkeleton />
            <CategoryGridSkeleton />
        </div>
    );
}
