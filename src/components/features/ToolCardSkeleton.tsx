export function ToolCardSkeleton() {
    return (
        <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden h-full flex flex-col animate-pulse">
            <div className="h-48 bg-gray-200" />
            <div className="p-4 flex-1 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-16 bg-gray-200 rounded w-full" />
                <div className="pt-4 mt-auto border-t border-[var(--border)] flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-16" />
                    <div className="h-5 bg-gray-200 rounded w-12" />
                </div>
            </div>
        </div>
    )
}
