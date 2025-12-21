import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { NewsItem } from "@/lib/services/news.service";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, ThumbsUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsCardProps {
    news: NewsItem;
}

function getPriorityColor(score: number) {
    if (score >= 8) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    if (score >= 6) return "bg-amber-500/20 text-amber-400 border-amber-500/50";
    return "bg-gray-500/20 text-gray-400 border-gray-500/50";
}

export function NewsCard({ news }: NewsCardProps) {
    return (
        <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
            <div className="relative h-48 w-full overflow-hidden">
                {news.image ? (
                    <Image
                        src={news.image}
                        alt={news.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No Image</span>
                    </div>
                )}

                {/* Tags - Top Left */}
                <div className="absolute top-2 left-2 flex gap-2">
                    {news.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>

                {/* Priority Score Badge - Top Right */}
                <div className="absolute top-2 right-2">
                    <div className={cn(
                        "px-2 py-1 rounded-md text-xs font-bold border backdrop-blur-sm",
                        getPriorityColor(news.priorityScore)
                    )}>
                        {news.priorityScore.toFixed(1)}
                    </div>
                </div>
            </div>

            <CardHeader className="p-4 pb-2">
                <Link href={`/ai-news/${news.slug}`} className="hover:text-primary transition-colors">
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
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {news.summary}
                </p>
            </CardContent>

            <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between items-center border-t mt-auto pt-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{news.stats.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{news.stats.likes.toLocaleString()}</span>
                    </div>
                </div>

                {news.source?.url && (
                    <Link
                        href={news.source.url}
                        target="_blank"
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
