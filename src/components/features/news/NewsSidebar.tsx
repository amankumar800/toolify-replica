import Link from "next/link";
import { NewsItem } from "@/lib/services/news.service";
import { ExternalLink, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsSidebarProps {
    news: NewsItem[];
    title?: string;
}

function getRankGradient(index: number): string {
    switch (index) {
        case 0:
            return "bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent";
        case 1:
            return "bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent";
        case 2:
            return "bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent";
        default:
            return "text-muted-foreground/30";
    }
}

export function NewsSidebar({ news, title = "Trending AI News" }: NewsSidebarProps) {
    return (
        <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 text-primary">
                <TrendingUp className="w-5 h-5" />
                <h2 className="text-lg font-bold">{title}</h2>
            </div>

            <div className="flex flex-col gap-5">
                {news.map((item, index) => (
                    <div key={item.id} className="group flex gap-4 items-start">
                        <span className={cn(
                            "text-2xl font-bold font-mono -mt-1 transition-all duration-300",
                            getRankGradient(index),
                            index < 3 && "group-hover:scale-110"
                        )}>
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 space-y-1">
                            <Link
                                href={item.source?.url || `/ai-news/${item.slug}`}
                                target={item.source?.url ? "_blank" : undefined}
                                className="font-medium text-sm leading-snug hover:text-primary transition-colors line-clamp-2 block"
                            >
                                {item.title}
                                {item.source?.url && <ExternalLink className="inline w-3 h-3 ml-1 opacity-50" />}
                            </Link>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="font-medium">{item.priorityScore.toFixed(1)}</span>
                                <span>•</span>
                                <span>{item.source?.name || "Toolify News"}</span>
                                {item.stats && <span>• {item.stats.views.toLocaleString()} reads</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t">
                <Link
                    href="/ai-news"
                    className="text-sm font-medium text-primary hover:underline flex items-center justify-center w-full gap-1"
                >
                    Read More AI News →
                </Link>
            </div>
        </div>
    );
}
