export function MasonryGrid({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {/* 
                We use [&>*] selection to enforce break-inside-avoid on all children.
                This is more robust than relying on the child component to have the class.
             */}
            <div className="contents [&>*]:break-inside-avoid [&>*]:mb-4">
                {children}
            </div>
        </div>
    );
}
