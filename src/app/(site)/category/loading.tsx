import { SidebarLoadingSkeleton } from '@/components/features/category/SidebarLoadingSkeleton';
import { CategoryLayout } from '@/components/features/category/CategoryLayout';

export default function Loading() {
    return (
        <div className="min-h-screen bg-toolify-bg">
            <CategoryLayout className="flex gap-8 relative py-8">
                {/* Sidebar Skeleton */}
                <aside className="hidden lg:block w-[280px] flex-shrink-0">
                    <div className="sticky top-24">
                        <SidebarLoadingSkeleton />
                    </div>
                </aside>

                {/* Main Content Skeleton */}
                <div className="flex-1 min-w-0">
                    <div className="h-8 w-64 bg-gray-200 rounded mb-4 animate-pulse" />
                    <div className="h-4 w-96 bg-gray-100 rounded mb-8 animate-pulse" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="h-80 bg-white rounded-xl border border-gray-100 animate-pulse">
                                <div className="h-40 bg-gray-100 rounded-t-xl" />
                                <div className="p-4 space-y-3">
                                    <div className="h-6 w-3/4 bg-gray-100 rounded" />
                                    <div className="h-4 w-full bg-gray-50 rounded" />
                                    <div className="h-4 w-2/3 bg-gray-50 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CategoryLayout>
        </div>
    );
}
