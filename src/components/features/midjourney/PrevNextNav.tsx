import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Prompt } from '@/lib/types/prompt';
import { cn } from '@/lib/utils';

interface PrevNextNavProps {
    prev: Prompt | null;
    next: Prompt | null;
    className?: string;
}

export function PrevNextNav({ prev, next, className }: PrevNextNavProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
            {/* Previous */}
            {prev ? (
                <Link
                    href={`/midjourney-library/${prev.id}`}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all group"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-purple-400 shrink-0" />
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        <Image
                            src={prev.imageUrl}
                            alt={prev.styleTitle || 'Previous style'}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">Previous</div>
                        <div className="text-white font-medium truncate">
                            {prev.srefCode ? `--sref ${prev.srefCode}` : prev.styleTitle}
                        </div>
                    </div>
                </Link>
            ) : (
                <div />
            )}

            {/* Next */}
            {next ? (
                <Link
                    href={`/midjourney-library/${next.id}`}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all group md:flex-row-reverse md:text-right"
                >
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 shrink-0" />
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        <Image
                            src={next.imageUrl}
                            alt={next.styleTitle || 'Next style'}
                            fill
                            className="object-cover"
                            sizes="64px"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">Next</div>
                        <div className="text-white font-medium truncate">
                            {next.srefCode ? `--sref ${next.srefCode}` : next.styleTitle}
                        </div>
                    </div>
                </Link>
            ) : (
                <div />
            )}
        </div>
    );
}
