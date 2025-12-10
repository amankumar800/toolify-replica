import {
    MessageSquare, Image, Music, Video, Code,
    Briefcase, GraduationCap, DollarSign,
    Layout, Search, PenTool, Share2, Settings,
    Mic, LucideIcon, Gamepad2
} from 'lucide-react';

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
