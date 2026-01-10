/**
 * Homepage Service
 *
 * Provides cached database queries for homepage data, replacing static JSON imports.
 * All functions return data in the exact format expected by UI components.
 *
 * @module homepage.service
 */

import { unstable_cache } from 'next/cache';
import { createAnonClient } from '@/lib/supabase/anon';
import type { MyTool, FeaturedTool, CategoryItem } from '@/lib/types/home.types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ICON_BG_COLORS = [
  '#E8F5E9', '#FFF3E0', '#E3F2FD', '#F3E5F5', '#FCE4EC',
  '#E8EAF6', '#E0F7FA', '#FBE9E7', '#FFF8E1', '#E1F5FE',
  '#ECEFF1', '#E0E0E0',
];

const DEFAULT_TOOL_COLORS = [
  '#4285F4', '#0066FF', '#000000', '#5B4AE3', '#10A37F',
  '#20808D', '#D97757', '#1DA1F2', '#15C39A', '#0075FF',
];

// Icon name to emoji mapping for categories
const ICON_EMOJI_MAP: Record<string, string> = {
  chat: '💬',
  image: '🎨',
  pen: '✏️',
  video: 'Video',
  mic: 'Mic',
  code: '💻',
  palette: '👨‍🎨',
  zap: '⚡',
  // Fallbacks
  default: '🔧',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a consistent color based on string hash
 */
function getColorFromString(str: string, colors: string[]): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Convert icon name to emoji
 */
function iconToEmoji(iconName: string | null): string {
  if (!iconName) return ICON_EMOJI_MAP.default;
  const normalized = iconName.toLowerCase();
  return ICON_EMOJI_MAP[normalized] || iconName || ICON_EMOJI_MAP.default;
}

/**
 * Generate favicon URL from website URL
 */
function getFaviconUrl(websiteUrl: string | null): string {
  if (!websiteUrl) return '';
  try {
    const url = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return '';
  }
}

// ============================================================================
// Featured Tools for Homepage
// ============================================================================

/**
 * Get featured tools for homepage display.
 * Queries featured_tools table joined with tools, transforms to FeaturedTool format.
 *
 * Cache: 30 minutes, tagged for revalidation
 */
export const getFeaturedToolsForHomepage = unstable_cache(
  async (): Promise<FeaturedTool[]> => {
    const supabase = createAnonClient();

    const { data, error } = await supabase
      .from('featured_tools')
      .select(`
        id,
        display_order,
        tools (
          id,
          name,
          slug,
          short_description,
          image_url,
          website_url,
          pricing
        )
      `)
      .eq('placement_type', 'homepage')
      .order('display_order', { ascending: true })
      .limit(16);

    if (error) {
      console.error('[homepage.service] Failed to fetch featured tools:', error);
      return [];
    }

    return (data ?? [])
      .filter((ft) => ft.tools !== null)
      .map((ft) => {
        const tool = ft.tools as {
          id: string;
          name: string;
          slug: string;
          short_description: string | null;
          image_url: string | null;
          website_url: string;
          pricing: string | null;
        };

        return {
          id: tool.slug,
          name: tool.name,
          icon: tool.image_url || getFaviconUrl(tool.website_url),
          iconBgColor: getColorFromString(tool.name, DEFAULT_ICON_BG_COLORS),
          description: tool.short_description || '',
          isFree: tool.pricing === 'Free',
          slug: tool.slug,
          websiteUrl: tool.website_url,
        };
      });
  },
  ['homepage-featured-tools'],
  { revalidate: 1800, tags: ['featured-tools', 'homepage'] }
);

// ============================================================================
// Categories for Homepage
// ============================================================================

/**
 * Get categories for homepage display.
 * Queries categories table, transforms to CategoryItem format.
 *
 * Cache: 1 hour, tagged for revalidation
 */
export const getCategoriesForHomepage = unstable_cache(
  async (): Promise<CategoryItem[]> => {
    const supabase = createAnonClient();

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, icon, tool_count, display_order')
      .order('display_order', { ascending: true })
      .limit(12);

    if (error) {
      console.error('[homepage.service] Failed to fetch categories:', error);
      return [];
    }

    return (data ?? []).map((cat) => ({
      id: cat.slug,
      name: cat.name,
      slug: cat.slug,
      icon: iconToEmoji(cat.icon),
      toolCount: cat.tool_count ?? 0,
      color: '#F3F4F6',
    }));
  },
  ['homepage-categories'],
  { revalidate: 3600, tags: ['categories', 'homepage'] }
);

// ============================================================================
// My Tools for Homepage (Popular Tools)
// ============================================================================

/**
 * Get "My Tools" for homepage display.
 * For anonymous users, returns popular/featured tools.
 * Transforms to MyTool format expected by MyToolsSection component.
 *
 * Cache: 1 hour, tagged for revalidation
 */
export const getMyToolsForHomepage = unstable_cache(
  async (): Promise<MyTool[]> => {
    const supabase = createAnonClient();

    const { data, error } = await supabase
      .from('tools')
      .select('id, name, slug, image_url, website_url')
      .eq('status', 'published')
      .order('saved_count', { ascending: false })
      .order('is_featured', { ascending: false })
      .limit(11);

    if (error) {
      console.error('[homepage.service] Failed to fetch my tools:', error);
      return [];
    }

    return (data ?? []).map((tool) => ({
      id: tool.slug,
      name: tool.name,
      icon: tool.image_url || getFaviconUrl(tool.website_url),
      url: `/tool/${tool.slug}`,
      color: getColorFromString(tool.name, DEFAULT_TOOL_COLORS),
    }));
  },
  ['homepage-my-tools'],
  { revalidate: 3600, tags: ['tools', 'homepage'] }
);
