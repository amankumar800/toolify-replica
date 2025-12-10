'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { Prompt } from '@/lib/types/prompt';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function PromptCard({ prompt }: { prompt: Prompt }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(prompt.promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Calculate height class based on aspect ratio approximation or let Image sort it out
    // Next.js Image needs width/height or fill. For masonry, 'fill' is hard if container has no height.
    // Better approach: Use 'width: 100%' and 'height: auto' styled image.
    // OR: Use standard aspectRatio class if we want uniform feel per type.

    let aspectRatioClass = "aspect-square";
    if (prompt.aspectRatio === 'portrait') aspectRatioClass = "aspect-[3/4]";
    if (prompt.aspectRatio === 'landscape') aspectRatioClass = "aspect-[16/9]";

    return (
        <div className="group relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
            <div className={cn("relative w-full", aspectRatioClass)}>
                <Link href={`/midjourney-library/${prompt.id}`} className="block relative w-full h-full cursor-pointer">
                    <Image
                        src={prompt.imageUrl}
                        alt={prompt.promptText}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
            </div>

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                <p className="text-white text-sm line-clamp-3 mb-3 text-shadow-sm">
                    {prompt.promptText}
                </p>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">@{prompt.author}</span>
                    <Button
                        size="sm"
                        variant="secondary"
                        className={cn("h-8 rounded-full", copied ? "bg-green-500 hover:bg-green-600 text-white" : "")}
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied ? "Copied" : "Copy"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
