'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { Prompt } from '@/lib/types/prompt';
import { cn } from '@/lib/utils';

export function PromptCard({ prompt }: { prompt: Prompt }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const textToCopy = prompt.srefCode
            ? `--sref ${prompt.srefCode}`
            : prompt.promptText;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    let aspectRatioClass = "aspect-square";
    if (prompt.aspectRatio === 'portrait') aspectRatioClass = "aspect-[3/4]";
    if (prompt.aspectRatio === 'landscape') aspectRatioClass = "aspect-[16/9]";

    return (
        <div className="group relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
            {/* Image Container */}
            <div className={cn("relative w-full", aspectRatioClass)}>
                <Link href={`/midjourney-library/${prompt.id}`} className="block relative w-full h-full cursor-pointer">
                    <Image
                        src={prompt.imageUrl}
                        alt={prompt.styleTitle || prompt.promptText}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
            </div>

            {/* Content - Always Visible */}
            <div className="p-4 bg-gray-900/95 border-t border-gray-800">
                {/* SREF Code or Style Title */}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-mono text-sm font-medium text-white truncate flex-1">
                        {prompt.srefCode ? (
                            <span className="text-purple-400">--sref {prompt.srefCode}</span>
                        ) : (
                            prompt.styleTitle || 'Midjourney Prompt'
                        )}
                    </h3>
                    <button
                        onClick={handleCopy}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-all ml-2 shrink-0",
                            copied
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/10 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400"
                        )}
                        aria-label="Copy code"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {prompt.tags.slice(0, 3).map(tag => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-400 capitalize"
                        >
                            {tag}
                        </span>
                    ))}
                    {prompt.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-gray-500">
                            +{prompt.tags.length - 3}
                        </span>
                    )}
                </div>
            </div>

            {/* Hover Overlay with Prompt Text */}
            <div className="absolute bottom-[72px] left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 pointer-events-none">
                <p className="text-white text-sm line-clamp-2 text-shadow-sm bg-black/60 p-2 rounded-lg backdrop-blur-sm">
                    {prompt.promptText}
                </p>
            </div>
        </div>
    );
}
