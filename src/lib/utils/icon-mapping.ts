import {
    MessageSquare, Image, Music, Video, Code,
    Briefcase, GraduationCap, DollarSign,
    Layout, Search, PenTool, Share2, Settings,
    Mic, LucideIcon, Gamepad2,
    Twitter, Linkedin, Facebook, Instagram
} from 'lucide-react';

// ============================================================================
// Social Platform Types and Constants
// ============================================================================

/**
 * Valid social platform names
 */
export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram';

/**
 * Map of social platform names to their Lucide icons
 * Requirements: 2.4 - Display appropriate icon for each platform
 */
export const SOCIAL_PLATFORM_ICON_MAP: Record<SocialPlatform, LucideIcon> = {
    twitter: Twitter,
    linkedin: Linkedin,
    facebook: Facebook,
    instagram: Instagram,
};

/**
 * List of all valid social platform names
 */
export const SOCIAL_PLATFORMS: SocialPlatform[] = ['twitter', 'linkedin', 'facebook', 'instagram'];

/**
 * Get the Lucide icon component for a social platform
 * 
 * @param platform - The platform name (twitter, linkedin, facebook, instagram)
 * @returns The corresponding Lucide icon component, or undefined if platform is invalid
 * 
 * Requirements: 2.4 - Display appropriate icon for each platform
 * 
 * @example
 * const TwitterIcon = getSocialPlatformIcon('twitter');
 * // Returns the Twitter icon component
 * 
 * const InvalidIcon = getSocialPlatformIcon('invalid');
 * // Returns undefined
 */
export function getSocialPlatformIcon(platform: string): LucideIcon | undefined {
    if (isSocialPlatform(platform)) {
        return SOCIAL_PLATFORM_ICON_MAP[platform];
    }
    return undefined;
}

/**
 * Type guard to check if a string is a valid social platform
 * 
 * @param platform - The string to check
 * @returns True if the string is a valid social platform name
 */
export function isSocialPlatform(platform: string): platform is SocialPlatform {
    return SOCIAL_PLATFORMS.includes(platform as SocialPlatform);
}

// ============================================================================
// Category Icon Mapping
// ============================================================================

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    'text': MessageSquare,
    'image': Image,
    'audio': Music,
    'video': Video,
    'code': Code,
    '3d': Layout,
    'business': Briefcase,
    'education': GraduationCap,
    'finance': DollarSign,
    'productivity': Settings,
    'marketing': Share2,
    'design': PenTool,
    'speech': Mic,
    'games': Gamepad2
};

export function getCategoryIcon(slug: string): LucideIcon {
    // Normalize slug (remove dashes, lowercase) to find loose match
    const key = slug.toLowerCase().split('-')[0];
    return CATEGORY_ICON_MAP[key] || Search; // Default to Search icon
}
