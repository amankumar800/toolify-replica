import { ToolCardSkeleton } from './ToolCardSkeleton';

export function GridSkeleton() {
    return (
        <div className="py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <ToolCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
