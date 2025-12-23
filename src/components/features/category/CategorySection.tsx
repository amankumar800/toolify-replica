'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Tool, Category } from '@/lib/types/tool';
import { ToolCard } from '@/components/features/tool/ToolCard'; // Will create this next

interface CategorySectionProps {
    category: Category;
    tools: Tool[];
}

export function CategorySection({ category, tools }: CategorySectionProps) {
    // Only show first 6-8 tools pending design spec, currently spec says 8
    const displayTools = tools.slice(0, 8);

    return (
        <section
            id={category.slug}
            className="scroll-mt-32 mb-12" // scroll-mt for sticky header offset
        >
            <div className="flex items-center justify-between mb-4 px-4 lg:px-0">
                <div className="flex items-baseline gap-2">
                    <h2 className="text-xl font-bold text-toolify-black">
                        {category.name}
                    </h2>
                    <span className="text-sm text-toolify-gray-400 font-medium">
                        ({category.toolCount || tools.length})
                    </span>
                </div>

                <Link
                    href={`/category/${category.slug}`}
                    className="group flex items-center gap-1 text-sm font-semibold text-toolify-purple-600 hover:text-toolify-purple-700 transition-colors"
                >
                    View All
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 lg:px-0">
                {displayTools.map(tool => (
                    <ToolCard key={tool.id} tool={tool} />
                ))}
            </div>
        </section>
    );
}
