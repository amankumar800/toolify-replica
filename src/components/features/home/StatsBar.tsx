import Link from 'next/link';
import { HomeStats } from '@/lib/types/home.types';
import { SEO_DEFAULTS } from '@/lib/constants/home.constants';

interface StatsBarProps extends Partial<HomeStats> { }

/**
 * Stats Bar - Shows total AI tools and categories count
 * 
 * Fixes applied:
 * - #15: Mobile-friendly shortened text
 * - #24: Shared types
 * - #44, #45: Accept dynamic stats as props
 */
export function StatsBar({
    totalTools = 27682,
    totalCategories = 459
}: StatsBarProps) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-1 text-base md:text-lg text-gray-600 mb-6">
            <Link
                href="/"
                className="text-[var(--primary)] font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none rounded"
            >
                {totalTools.toLocaleString()} AIs
            </Link>
            <span>and</span>
            <Link
                href="/category"
                className="text-[var(--primary)] font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none rounded"
            >
                {totalCategories} categories
            </Link>
            {/* Issue #15: Mobile shows shortened text, desktop shows full */}
            <span className="sm:hidden">- updated daily</span>
            <span className="hidden sm:inline">
                in the best AI tools directory. AI tools list & GPTs store are updated daily by ChatGPT.
            </span>
        </div>
    );
}
