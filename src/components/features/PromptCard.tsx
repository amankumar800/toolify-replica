'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Eye, Heart } from 'lucide-react';
import { Prompt } from '@/lib/types/prompt';
import { cn } from '@/lib/utils';

interface PromptCardProps {
    prompt: Prompt;
    onTagClick?: (tag: string) => void;
}

export function PromptCard({ prompt, onTagClick }: PromptCardProps) {
    const [copied, setCopied] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

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

    const handleTagClick = (e: React.MouseEvent, tag: string) => {
        e.preventDefault();
        e.stopPropagation();
        onTagClick?.(tag);
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    let aspectRatioClass = "aspect-square";
    if (prompt.aspectRatio === 'portrait') aspectRatioClass = "aspect-[3/4]";
    if (prompt.aspectRatio === 'landscape') aspectRatioClass = "aspect-[16/9]";

    return (
        <div className="group relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
            {/* Image Container */}
            <div className={cn("relative w-full", aspectRatioClass)}>
                <Link href={`/midjourney-library/${prompt.id}`} className="block relative w-full h-full cursor-pointer">
                    {/* Loading Skeleton */}
                    {!imageLoaded && !imageError && (
                        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-gray-700" />
                        </div>
                    )}

                    {/* Error State */}
                    {imageError && (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">Image unavailable</span>
                        </div>
                    )}

                    <Image
                        src={prompt.imageUrl}
                        alt={prompt.styleTitle || prompt.promptText}
                        fill
                        className={cn(
                            "object-cover transition-all duration-500 group-hover:scale-105",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Stats Overlay (top right) */}
                    <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white">
                            <Eye className="w-3 h-3" />
                            {formatNumber(prompt.views)}
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs text-white">
                            <Heart className="w-3 h-3" />
                            {formatNumber(prompt.likes)}
                        </span>
                    </div>

                    {/* Hover Overlay with Prompt Text - Inside image container */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100 pointer-events-none">
                        <p className="text-white text-sm line-clamp-3 bg-black/80 p-3 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg">
                            {prompt.promptText}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Content - Always Visible */}
            <div className="p-4 bg-gray-900/95 border-t border-gray-800">
                {/* SREF Code or Style Title + Copy Button */}
                <div className="flex items-center justify-between mb-3">
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
                            "flex items-center justify-center w-9 h-9 rounded-lg transition-all ml-2 shrink-0 relative",
                            copied
                                ? "bg-green-500/30 text-green-400 ring-2 ring-green-500/50"
                                : "bg-white/10 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400"
                        )}
                        aria-label={copied ? "Copied!" : "Copy code"}
                        title={copied ? "Copied!" : "Copy to clipboard"}
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {/* Copy feedback tooltip */}
                        {copied && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-600 text-white text-xs rounded whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                                Copied!
                            </span>
                        )}
                    </button>
                </div>

                {/* Stats Row - Improved contrast for accessibility */}
                <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(prompt.views)} views
                    </span>
                    <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {formatNumber(prompt.likes)} likes
                    </span>
                </div>

                {/* Tags - Clickable */}
                <div className="flex flex-wrap gap-1.5">
                    {prompt.tags.slice(0, 3).map(tag => (
                        <button
                            key={tag}
                            onClick={(e) => handleTagClick(e, tag)}
                            className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-400 capitalize hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
                        >
                            {tag}
                        </button>
                    ))}
                    {prompt.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-gray-400">
                            +{prompt.tags.length - 3}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
