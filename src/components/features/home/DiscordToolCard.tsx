'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users, Zap, ExternalLink } from 'lucide-react';
import type { DiscordTool } from '@/lib/types/home.types';
import { cn } from '@/lib/utils';

/**
 * Format large numbers (e.g., 125000 → "125K")
 */
function formatCount(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
}

interface DiscordToolCardProps extends DiscordTool { }

/**
 * Discord Tool Card - Card component for tools with Discord communities
 * 
 * Features:
 * - Tool icon and name with link to tool page
 * - Member count and online stats
 * - "Join Discord" button with Discord brand color
 */
export function DiscordToolCard({
    name,
    icon,
    iconBgColor,
    description,
    slug,
    discordUrl,
    discordMembers,
    discordOnline7d,
}: DiscordToolCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all hover:border-gray-200">
            {/* Tool header */}
            <Link
                href={`/tool/${slug}`}
                className="flex items-center gap-3 mb-3 group"
            >
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: iconBgColor }}
                >
                    {icon ? (
                        <Image
                            src={icon}
                            alt={name}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                            unoptimized
                        />
                    ) : (
                        <span className="text-lg">🤖</span>
                    )}
                </div>
                <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                    {name}
                </h3>
            </Link>

            {/* Discord Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{formatCount(discordMembers)}</span>
                    <span className="text-gray-400">members</span>
                </span>
                {discordOnline7d > 0 && (
                    <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-600">{formatCount(discordOnline7d)}</span>
                        <span className="text-gray-400">online</span>
                    </span>
                )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[2.5rem]">
                {description}
            </p>

            {/* Join Discord button */}
            {discordUrl && (
                <a
                    href={discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "inline-flex items-center justify-center w-full px-4 py-2.5",
                        "bg-[#5865F2] text-white rounded-lg font-medium text-sm",
                        "hover:bg-[#4752C4] transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-[#5865F2] focus-visible:ring-offset-2 focus-visible:outline-none"
                    )}
                >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Join Discord
                    <ExternalLink className="w-3 h-3 ml-1.5 opacity-70" />
                </a>
            )}
        </div>
    );
}
