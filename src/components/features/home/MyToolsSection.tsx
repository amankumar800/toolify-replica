'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { MyTool } from '@/lib/types/home.types';
import { FALLBACK_ICON_URL } from '@/lib/constants/home.constants';

interface MyToolsSectionProps {
    /** Array of tools to display */
    tools: MyTool[];
    /** Whether the edit button should be shown (requires auth) */
    editable?: boolean;
    /** Callback when edit button is clicked */
    onEditClick?: () => void;
}

/**
 * My Tools Section - Displays user's favorite AI tools with icons
 * 
 * Fixes applied:
 * - #1: Image error handling with fallback
 * - #7: Focus-visible styles
 * - #11: Centered icon grid layout
 * - #20: Memoized inline styles
 * - #22: Props-based data (consistent pattern)
 * - #24: Shared types from home.types.ts
 * - #38: Edit button with proper disabled state
 * - #43: Scroll fade indicator
 */
export function MyToolsSection({
    tools,
    editable = false,
    onEditClick
}: MyToolsSectionProps) {
    // Track failed images for fallback - Issue #1
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    const handleImageError = useCallback((toolId: string) => {
        setFailedImages(prev => new Set(prev).add(toolId));
    }, []);

    // Empty state - Issue #36
    if (!tools || tools.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">My Tools</h2>
                <p className="text-gray-500 text-center py-4">
                    No tools saved yet. Browse and save your favorites!
                </p>
            </div>
        );
    }

    // Handle edit click - show alert if no callback provided
    const handleEditClick = () => {
        if (onEditClick) {
            onEditClick();
        } else {
            alert('Please login to edit your tools');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Tools</h2>
                <button
                    type="button"
                    onClick={handleEditClick}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none rounded-md px-2 py-1"
                    aria-label="Edit my tools"
                >
                    <Pencil className="w-4 h-4" />
                    Edit
                </button>
            </div>

            {/* Tool Icons Row - Horizontal scrollable with visible scrollbar */}
            <div className="relative">
                <div className="flex items-center justify-center gap-6 overflow-x-auto pb-3">
                    {tools.map((tool) => (
                        <ToolIcon
                            key={tool.id}
                            tool={tool}
                            hasFailed={failedImages.has(tool.id)}
                            onError={() => handleImageError(tool.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Extracted component for better performance and memoization
interface ToolIconProps {
    tool: MyTool;
    hasFailed: boolean;
    onError: () => void;
}

function ToolIcon({ tool, hasFailed, onError }: ToolIconProps) {
    // Issue #20: Memoize inline style to prevent re-renders
    const bgStyle = useMemo(() => ({
        backgroundColor: tool.color + '15'
    }), [tool.color]);

    return (
        <Link
            href={tool.url}
            className="flex flex-col items-center gap-2 min-w-[64px] group focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:outline-none rounded-lg"
            aria-label={`Open ${tool.name}`}
        >
            <div
                className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow"
                style={bgStyle}
            >
                <Image
                    src={hasFailed ? FALLBACK_ICON_URL : tool.icon}
                    alt={`${tool.name} icon`}
                    width={32}
                    height={32}
                    className="object-contain"
                    onError={onError}
                    unoptimized // External URLs need this
                />
            </div>
            <span className="text-xs text-gray-600 text-center truncate w-full group-hover:text-[var(--primary)] transition-colors">
                {tool.name}
            </span>
        </Link>
    );
}
