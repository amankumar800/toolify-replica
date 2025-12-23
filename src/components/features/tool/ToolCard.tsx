'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tool } from '@/lib/types/tool';
import { Star, Bookmark, ExternalLink, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCardProps {
    tool: Tool;
    priority?: boolean;
}

export function ToolCard({ tool, priority = false }: ToolCardProps) {
    return (
        <div className="group relative bg-white rounded-xl border border-gray-100 hover:border-toolify-purple-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">
            {/* Top Section: Image & Badge */}
            <div className="relative h-40 w-full overflow-hidden bg-gray-50">
                <Image
                    src={tool.image}
                    alt={tool.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={priority}
                />
                <div className="absolute top-3 right-3 flex gap-2">
                    <button className="p-1.5 bg-white/90 rounded-full hover:text-toolify-purple-600 transition-colors shadow-sm backdrop-blur-sm">
                        <Bookmark className="w-4 h-4" />
                    </button>
                </div>
                {tool.pricing && (
                    <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white backdrop-blur-md rounded-md">
                            {tool.pricing}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-4">
                <div className="flex justify-between items-start mb-2">
                    <Link href={`/${tool.slug}`} className="hover:text-toolify-purple-600 transition-colors">
                        <h3 className="font-bold text-toolify-black line-clamp-1 flex items-center gap-1">
                            {tool.name}
                            {tool.verified && (
                                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
                            )}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{tool.reviewScore.toFixed(1)}</span>
                    </div>
                </div>

                <p className="text-sm text-toolify-gray-500 line-clamp-2 mb-4 flex-1">
                    {tool.shortDescription}
                </p>

                {/* Footer: Tags & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                    <div className="flex flex-wrap gap-1 max-w-[70%]">
                        {tool.categories.slice(0, 1).map(cat => (
                            <span key={cat} className="text-xs text-toolify-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                {cat}
                            </span>
                        ))}
                    </div>
                    <a
                        href={tool.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-toolify-gray-400 hover:text-toolify-purple-600 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
