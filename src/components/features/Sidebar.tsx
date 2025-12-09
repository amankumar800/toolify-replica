import Link from 'next/link';
import { getCategories } from '@/lib/services/tools.service';

export async function Sidebar() {
    const categories = await getCategories();

    return (
        <aside className="hidden lg:block w-64 flex-shrink-0 pr-8">
            <div className="sticky top-[calc(var(--header-height)+2rem)]">
                <h3 className="font-bold text-lg mb-4 px-2">Categories</h3>
                <nav className="space-y-1">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/category/${category.slug}`}
                            className="flex items-center justify-between px-2 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-purple-50 rounded-md transition-colors"
                        >
                            <span>{category.name}</span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                                {category.count}
                            </span>
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
