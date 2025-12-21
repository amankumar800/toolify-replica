'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FeaturedTool } from '@/lib/types/home.types';
import { FALLBACK_ICON_URL } from '@/lib/constants/home.constants';

interface CompactToolCardProps extends FeaturedTool { }

/**
 * Compact Tool Card - Displays a tool with icon, name, description, and Free badge
 * 
 * Fixes applied:
 * - #1: Image error handling with fallback
 * - #7: Focus-visible styles
 * - #8: Improved alt text
 * - #13: Hover lift animation
 * - #24: Shared types from home.types.ts
 */
export function CompactToolCard({
    id,
    name,
    icon,
    iconBgColor = '#F3F4F6',
    description,
    isFree = false,
    slug,
    websiteUrl,
}: CompactToolCardProps) {
    // Issue #1: Track image load failure
    const [imageFailed, setImageFailed] = useState(false);

    const handleImageError = useCallback(() => {
        setImageFailed(true);
    }, []);

    return (
        <Link
            href={`/tool/${slug}`}
            className={`
                group relative bg-white rounded-xl border border-gray-100 p-4 
                flex flex-col h-full
                transition-all duration-200
                hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5
                focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none
            `}
            aria-label={`View ${name} - ${isFree ? 'Free' : 'Paid'} AI tool`}
        >
            {/* Free Badge - Issue #1 styling */}
            {isFree && (
                <span
                    className="absolute top-3 right-3 text-xs font-medium text-pink-500"
                    aria-label="Free tool"
                >
                    Free
                </span>
            )}

            {/* Icon with background */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 overflow-hidden"
                style={{ backgroundColor: iconBgColor }}
            >
                <Image
                    src={imageFailed ? FALLBACK_ICON_URL : icon}
                    alt={`${name} AI tool icon`}
                    width={24}
                    height={24}
                    className="object-contain"
                    onError={handleImageError}
                    unoptimized // External URLs
                />
            </div>

            {/* Content */}
            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                {name}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2 flex-1">
                {description}
            </p>

            {/* Optional: External link indicator */}
            {websiteUrl && (
                <span className="sr-only">Visit {name} website</span>
            )}
        </Link>
    );
}
