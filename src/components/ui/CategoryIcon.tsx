'use client';

import {
    MessagesSquare,
    ClipboardList,
    ImagePlus,
    Palette,
    Code2,
    Clapperboard,
    GraduationCap,
    FileEdit,
    AudioLines,
    BarChart3,
    Music2,
    Scan,
    Megaphone,
    LineChart,
    Users,
    Scale,
    CalendarDays,
    HeartPulse,
    ScanEye,
    Ruler,
    Search,
    Shapes,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Category configuration with icon and unique color
 */
interface CategoryConfig {
    icon: LucideIcon;
    color: string;      // Icon color
    bgColor: string;    // Background color (lighter shade)
}

/**
 * Mapping of category slugs to icons and their unique vibrant colors
 * Each category has a distinct color for visual variety
 */
const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
    'chatbots-virtual-companions': {
        icon: MessagesSquare,
        color: '#3B82F6',      // Blue
        bgColor: '#DBEAFE',
    },
    'office-productivity': {
        icon: ClipboardList,
        color: '#F97316',      // Orange
        bgColor: '#FFEDD5',
    },
    'image-generation-editing': {
        icon: ImagePlus,
        color: '#EC4899',      // Pink
        bgColor: '#FCE7F3',
    },
    'art-creative-design': {
        icon: Palette,
        color: '#8B5CF6',      // Purple
        bgColor: '#EDE9FE',
    },
    'coding-development': {
        icon: Code2,
        color: '#10B981',      // Emerald
        bgColor: '#D1FAE5',
    },
    'video-animation': {
        icon: Clapperboard,
        color: '#EF4444',      // Red
        bgColor: '#FEE2E2',
    },
    'education-translation': {
        icon: GraduationCap,
        color: '#0EA5E9',      // Sky Blue
        bgColor: '#E0F2FE',
    },
    'writing-editing': {
        icon: FileEdit,
        color: '#6366F1',      // Indigo
        bgColor: '#E0E7FF',
    },
    'voice-generation-conversion': {
        icon: AudioLines,
        color: '#14B8A6',      // Teal
        bgColor: '#CCFBF1',
    },
    'business-management': {
        icon: BarChart3,
        color: '#F59E0B',      // Amber
        bgColor: '#FEF3C7',
    },
    'music-audio': {
        icon: Music2,
        color: '#A855F7',      // Violet
        bgColor: '#F3E8FF',
    },
    'ai-detection-anti-detection': {
        icon: Scan,
        color: '#06B6D4',      // Cyan
        bgColor: '#CFFAFE',
    },
    'marketing-advertising': {
        icon: Megaphone,
        color: '#F43F5E',      // Rose
        bgColor: '#FFE4E6',
    },
    'research-data-analysis': {
        icon: LineChart,
        color: '#22C55E',      // Green
        bgColor: '#DCFCE7',
    },
    'social-media': {
        icon: Users,
        color: '#0891B2',      // Cyan-600
        bgColor: '#E0F7FA',
    },
    'legal-finance': {
        icon: Scale,
        color: '#7C3AED',      // Violet-600
        bgColor: '#EDE9FE',
    },
    'daily-life': {
        icon: CalendarDays,
        color: '#059669',      // Emerald-600
        bgColor: '#D1FAE5',
    },
    'health-wellness': {
        icon: HeartPulse,
        color: '#DC2626',      // Red-600
        bgColor: '#FEE2E2',
    },
    'image-analysis': {
        icon: ScanEye,
        color: '#7C3AED',      // Purple-600
        bgColor: '#EDE9FE',
    },
    'interior-architectural-design': {
        icon: Ruler,
        color: '#CA8A04',      // Yellow-600
        bgColor: '#FEF9C3',
    },
    'business-research': {
        icon: Search,
        color: '#4F46E5',      // Indigo-600
        bgColor: '#E0E7FF',
    },
    'other-1': {
        icon: Shapes,
        color: '#64748B',      // Slate
        bgColor: '#F1F5F9',
    },
    'other': {
        icon: Shapes,
        color: '#64748B',      // Slate
        bgColor: '#F1F5F9',
    },
};

// Default config for unknown categories
const DEFAULT_CONFIG: CategoryConfig = {
    icon: Shapes,
    color: '#64748B',
    bgColor: '#F1F5F9',
};

/**
 * Size variants for the icon
 */
type IconSize = 'sm' | 'md' | 'lg';

interface CategoryIconProps {
    /** Category slug to determine which icon to display */
    slug: string;
    /** Size of the icon: sm (16px), md (20px), lg (24px) */
    size?: IconSize;
    /** Whether to show the colored background container */
    showBackground?: boolean;
    /** Use muted color instead of category color (for inactive states) */
    muted?: boolean;
    /** Additional CSS classes for the icon */
    className?: string;
}

const SIZE_CLASSES: Record<IconSize, { icon: string; container: string }> = {
    sm: { icon: 'w-4 h-4', container: 'w-7 h-7' },
    md: { icon: 'w-5 h-5', container: 'w-9 h-9' },
    lg: { icon: 'w-6 h-6', container: 'w-12 h-12' },
};

/**
 * CategoryIcon Component
 * 
 * Renders a colorful Lucide icon based on the category slug.
 * Each category has its own unique vibrant color for visual variety.
 * 
 * @example
 * // Colorful icon with background
 * <CategoryIcon slug="chatbots-virtual-companions" size="lg" showBackground />
 * 
 * // Just the colored icon
 * <CategoryIcon slug="coding-development" size="md" />
 * 
 * // Muted version for inactive states
 * <CategoryIcon slug="art-creative-design" muted />
 */
export function CategoryIcon({
    slug,
    size = 'md',
    showBackground = false,
    muted = false,
    className,
}: CategoryIconProps) {
    const config = CATEGORY_CONFIG[slug] || DEFAULT_CONFIG;
    const Icon = config.icon;
    const sizeConfig = SIZE_CLASSES[size];

    const iconColor = muted ? '#9CA3AF' : config.color;
    const bgColor = muted ? '#F3F4F6' : config.bgColor;

    if (showBackground) {
        return (
            <div
                className={cn(
                    sizeConfig.container,
                    'rounded-xl flex items-center justify-center transition-all duration-200',
                    className
                )}
                style={{ backgroundColor: bgColor }}
                aria-hidden="true"
            >
                <Icon
                    className={sizeConfig.icon}
                    style={{ color: iconColor }}
                />
            </div>
        );
    }

    return (
        <Icon
            className={cn(
                sizeConfig.icon,
                'transition-colors duration-200',
                className
            )}
            style={{ color: iconColor }}
            aria-hidden="true"
        />
    );
}

/**
 * Get the category configuration (icon, color, bgColor)
 */
export function getCategoryConfig(slug: string): CategoryConfig {
    return CATEGORY_CONFIG[slug] || DEFAULT_CONFIG;
}

/**
 * Get the icon component for a category slug
 */
export function getCategoryIconComponent(slug: string): LucideIcon {
    return (CATEGORY_CONFIG[slug] || DEFAULT_CONFIG).icon;
}

export default CategoryIcon;

