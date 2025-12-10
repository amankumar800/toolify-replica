import { cn } from "@/lib/utils";

export function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md border border-yellow-200 text-white font-bold text-sm">
                1
            </div>
        );
    }
    if (rank === 2) {
        return (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-md border border-gray-200 text-white font-bold text-sm">
                2
            </div>
        );
    }
    if (rank === 3) {
        return (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 shadow-md border border-orange-200 text-white font-bold text-sm">
                3
            </div>
        );
    }

    return (
        <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium text-gray-500 bg-gray-100",
            rank <= 10 ? "text-gray-700 font-bold" : ""
        )}>
            {rank}
        </div>
    );
}
