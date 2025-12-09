import Link from 'next/link';
import Image from 'next/image';
import { Share2, Bookmark } from 'lucide-react';
import { Tool } from '@/lib/types/tool';

interface ToolCardProps {
    tool: Tool;
    priority?: boolean;
}

export function ToolCard({ tool, priority = false }: ToolCardProps) {
    return (
        <article className="group relative bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
            <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                <Image
                    src={tool.image}
                    alt={`${tool.name} interface`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={priority}
                />
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button type="button" className="p-2 bg-white/90 rounded-full hover:text-[var(--primary)] shadow-sm" aria-label="Share">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-2 bg-white/90 rounded-full hover:text-[var(--primary)] shadow-sm" aria-label="Save">
                        <Bookmark className="w-4 h-4" />
                    </button>
                </div>
                {tool.pricing === 'Free' && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-[var(--radius-sm)]">
                        FREE
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h2 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                            <Link href={`/tool/${tool.slug}`} className="before:absolute before:inset-0">
                                {tool.name}
                            </Link>
                        </h2>
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                            {tool.shortDescription}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                    {tool.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-auto">
                    <div className="flex gap-2">
                        {tool.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <div className="text-xs font-semibold text-[var(--primary)]">
                        {tool.pricing}
                    </div>
                </div>
            </div>
        </article>
    );
}
