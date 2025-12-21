"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { NewsItem } from "@/lib/services/news.service";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, ThumbsUp, ExternalLink, ChevronDown, ChevronUp, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsCardProps {
    news: NewsItem;
}

// Fix #12: Extract helper function
function getPriorityColor(score: number): string {
    if (score >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    if (score >= 6) return "bg-amber-500/20 text-amber-400 border-amber-500/50";
    return "bg-gray-500/20 text-gray-400 border-gray-500/50";
}

// Fix #12: Extract sub-component for image
function NewsCardImage({
    src,
    alt,
    onError
}: {
    src?: string;
    alt: string;
    onError: () => void;
}) {
    if (!src) {
        return (
            <div className="w-full h-full bg-muted flex items-center justify-center">
                <ImageOff className="w-8 h-8 text-muted-foreground" />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={onError}
            // Fix #5: Add loading placeholder
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAQQBAwUBAAAAAAAAAAAAAQACAwQFERIhBhMUMUFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAaEQADAAMBAAAAAAAAAAAAAAAAAQIDESES/9oADAMBEEhEEEH8VyrooooorX/Bzn//2Q=="
        />
    );
}

// Fix #12: Extract sub-component for stats
function NewsCardStats({ views, likes }: { views: number; likes: number }) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Eye className="w-3 h-3" />
                <span>{views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                <ThumbsUp className="w-3 h-3" />
                <span>{likes.toLocaleString()}</span>
            </div>
        </div>
    );
}

export function NewsCard({ news }: NewsCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    // Fix #13: Image error state
    const [imageError, setImageError] = useState(false);

    return (
        <Card className={cn(
            "flex flex-col overflow-hidden group",
            "transition-all duration-300 ease-out",
            "hover:shadow-xl hover:shadow-primary/5",
            "hover:-translate-y-1",
            // Fix #7: Remove h-full to allow natural height, use min-height instead
            "min-h-[420px]",
            isExpanded && "ring-2 ring-primary/20"
        )}>
            <div className="relative h-48 w-full overflow-hidden flex-shrink-0">
                <NewsCardImage
                    src={imageError ? undefined : news.image}
                    alt={news.title}
                    onError={() => setImageError(true)}
                />

                {/* Tags - Top Left */}
                <div className="absolute top-2 left-2 flex gap-2">
                    {news.tags.slice(0, 2).map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-black/50 text-white backdrop-blur-sm text-xs transition-transform duration-200 hover:scale-105"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>

                {/* Priority Score Badge - Top Right */}
                <div className="absolute top-2 right-2">
                    <div className={cn(
                        "px-2 py-1 rounded-md text-xs font-bold border backdrop-blur-sm",
                        "transition-transform duration-200 group-hover:scale-110",
                        getPriorityColor(news.priorityScore)
                    )}>
                        {news.priorityScore.toFixed(1)}
                    </div>
                </div>
            </div>

            <CardHeader className="p-4 pb-2">
                {/* Fix #14: Remove duplicate toggle - title is now just a link */}
                <Link
                    href={`/ai-news/${news.slug}`}
                    className="text-left hover:text-primary transition-colors"
                >
                    <h3 className="text-lg font-bold line-clamp-2 leading-tight">
                        {news.title}
                    </h3>
                </Link>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1">
                        {news.sourceCount} source{news.sourceCount > 1 ? 's' : ''}
                        <span>|</span>
                        {news.source?.name}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(news.date), { addSuffix: true })}</span>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 flex-grow">
                {/* Summary with expand/collapse animation - Fix #7: constrained height */}
                <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-out",
                    isExpanded ? "max-h-[300px]" : "max-h-16"
                )}>
                    <p className={cn(
                        "text-sm text-muted-foreground",
                        !isExpanded && "line-clamp-3"
                    )}>
                        {news.summary}
                    </p>

                    {/* Expanded content */}
                    {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-sm text-foreground">
                                {news.content?.slice(0, 300)}...
                            </p>
                            <Link
                                href={`/ai-news/${news.slug}`}
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                            >
                                Read full article →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Expand/Collapse Toggle - Fix #10: aria-expanded */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Collapse article preview" : "Expand article preview"}
                    className={cn(
                        "w-full mt-2 flex items-center justify-center gap-1",
                        "text-xs text-muted-foreground hover:text-primary",
                        "transition-colors duration-200 py-1"
                    )}
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" />
                            <span>Show less</span>
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            <span>Expand</span>
                        </>
                    )}
                </button>
            </CardContent>

            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center border-t mt-auto pt-4">
                <NewsCardStats views={news.stats.views} likes={news.stats.likes} />

                {news.source?.url && (
                    <Link
                        href={news.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                        <span>Source</span>
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
}
