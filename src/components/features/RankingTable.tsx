import Link from 'next/link';
import Image from 'next/image';
import { type Tool } from '@/lib/types/tool';
import { RankBadge } from '@/components/ui/badge-rank';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface RankingTableProps {
    tools: Tool[];
}

export function RankingTable({ tools }: RankingTableProps) {
    const formatNumber = (num?: number) => {
        if (!num) return 'N/A';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const formatChange = (pct?: number) => {
        if (pct === undefined) return <Minus className="w-4 h-4 text-gray-300" />;
        if (pct > 0) return (
            <div className="flex items-center text-green-600 font-medium text-sm">
                <ArrowUp className="w-3 h-3 mr-1" />
                {pct}%
            </div>
        );
        if (pct < 0) return (
            <div className="flex items-center text-red-600 font-medium text-sm">
                <ArrowDown className="w-3 h-3 mr-1" />
                {Math.abs(pct)}%
            </div>
        );
        return <span className="text-gray-400 text-sm">0%</span>;
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 text-xs uppercase text-[var(--muted-foreground)] font-semibold">
                    <tr>
                        <th className="p-4 w-16 text-center">Rank</th>
                        <th className="p-4 min-w-[200px]">Tool</th>
                        <th className="p-4 hidden md:table-cell">Categories</th>
                        <th className="p-4 hidden md:table-cell text-right">Monthly Visits</th>
                        <th className="p-4 hidden lg:table-cell text-right">Growth</th>
                        <th className="p-4 hidden lg:table-cell text-right">Pricing</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                    {tools.map((tool, index) => (
                        <tr key={tool.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="p-4 text-center">
                                <div className="flex justify-center">
                                    <RankBadge rank={index + 1} />
                                </div>
                            </td>
                            <td className="p-4">
                                <Link href={`/tool/${tool.slug}`} className="flex items-center gap-4 block">
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                        <Image
                                            src={tool.image}
                                            alt={tool.name}
                                            fill
                                            className="object-cover"
                                            sizes="40px"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 group-hover:text-[var(--primary)] transition-colors">
                                            {tool.name}
                                        </div>
                                        <div className="text-xs text-[var(--muted-foreground)] line-clamp-1 max-w-[200px]">
                                            {tool.shortDescription}
                                        </div>
                                    </div>
                                </Link>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {tool.categories.slice(0, 2).map((cat, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 border border-gray-200 whitespace-nowrap">
                                            {cat}
                                        </span>
                                    ))}
                                    {tool.categories.length > 2 && (
                                        <span className="text-xs text-gray-400 px-1">+{tool.categories.length - 2}</span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 hidden md:table-cell text-right font-mono text-sm text-gray-700">
                                {formatNumber(tool.monthlyVisits)}
                            </td>
                            <td className="p-4 hidden lg:table-cell text-right">
                                <div className="flex justify-end">
                                    {formatChange(tool.changePercentage)}
                                </div>
                            </td>
                            <td className="p-4 hidden lg:table-cell text-right text-sm text-[var(--muted-foreground)]">
                                {tool.pricing}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
