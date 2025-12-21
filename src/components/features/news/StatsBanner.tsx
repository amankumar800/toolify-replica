import { Sparkles } from "lucide-react";

interface StatsBannerProps {
    totalAnalyzed: number;
    importantStories: number;
}

export function StatsBanner({ totalAnalyzed, importantStories }: StatsBannerProps) {
    return (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-foreground/80">
                <strong className="text-foreground">Toolify AI</strong> analyzed{' '}
                <span className="font-bold text-primary">{totalAnalyzed}</span> articles
                in the past 24 hours and found{' '}
                <span className="font-bold text-primary">{importantStories}</span> important
                stories (score ≥ 5.5).
            </p>
        </div>
    );
}
