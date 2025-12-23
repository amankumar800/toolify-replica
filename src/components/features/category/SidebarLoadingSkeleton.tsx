export function SidebarLoadingSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                    <div className="h-4 w-20 bg-gray-200 rounded mx-3" />
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((j) => (
                            <div key={j} className="h-9 w-full bg-gray-100 rounded-lg mx-0" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
