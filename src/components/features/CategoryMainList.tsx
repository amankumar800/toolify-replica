import Link from 'next/link';
import { CategoryGroup } from '@/lib/types/tool';

interface CategoryMainListProps {
    groups: CategoryGroup[];
}

export function CategoryMainList({ groups }: CategoryMainListProps) {
    return (
        <div className="flex-1 min-w-0">
            {groups.map((group) => (
                <section
                    key={group.id}
                    id={group.id}
                    className="mb-12 scroll-mt-28 md:scroll-mt-24" // Scroll margin for sticky header
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">
                        {group.name}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {group.categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/category/${category.slug}`}
                                className="group flex justify-between items-center py-2 hover:bg-gray-50 rounded px-2 -mx-2 transition-colors"
                            >
                                <span className="text-gray-700 group-hover:text-blue-600 transition-colors">
                                    {category.name}
                                </span>
                                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                    {category.count}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
