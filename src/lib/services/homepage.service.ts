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
// Tools by Filter for Homepage
// ============================================================================

const VALID_FILTERS = ['today', 'new', 'most-saved', 'most-used', 'apps', 'browser-extension', 'discord'] as const;
type FilterType = (typeof VALID_FILTERS)[number];

function isValidFilter(filter: string): filter is FilterType {
  return VALID_FILTERS.includes(filter as FilterType);
}

/**
 * Get tools filtered by platform type or metric.
 * Falls back to 'today' (featured tools) for invalid filters.
 *
 * Cache: 30 minutes, tagged for revalidation
 */
export const getToolsByFilter = unstable_cache(
  async (filter: string): Promise<FeaturedTool[]> => {
    const safeFilter: FilterType = isValidFilter(filter) ? filter : 'today';

    // 'today' uses existing featured tools logic
    if (safeFilter === 'today') {
      // Call the inner function directly to avoid cache nesting
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
        console.error('[homepage.service] getToolsByFilter(today) failed:', error);
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
    }

    // For other filters, query tools table directly
    const supabase = createAnonClient();
    let query = supabase
      .from('tools')
      .select('id, name, slug, short_description, image_url, website_url, pricing')
      .eq('status', 'published');

    switch (safeFilter) {
      case 'apps':
        query = query.eq('platform', 'app');
        break;
      case 'browser-extension':
        query = query.eq('platform', 'browser-extension');
        break;
      case 'discord':
        query = query.eq('platform', 'discord');
        break;
      case 'most-saved':
        query = query.order('saved_count', { ascending: false, nullsFirst: false });
        break;
      case 'most-used':
        query = query.order('monthly_visits', { ascending: false, nullsFirst: false });
        break;
      case 'new':
        query = query.eq('is_new', true).order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query.limit(16);

    if (error) {
      console.error(`[homepage.service] getToolsByFilter(${safeFilter}) failed:`, error);
      return [];
    }

    return (data ?? []).map((tool) => ({
      id: tool.slug,
      name: tool.name,
      icon: tool.image_url || getFaviconUrl(tool.website_url),
      iconBgColor: getColorFromString(tool.name, DEFAULT_ICON_BG_COLORS),
      description: tool.short_description || '',
      isFree: tool.pricing === 'Free',
      slug: tool.slug,
      websiteUrl: tool.website_url,
    }));
  },
  ['homepage-tools-by-filter'],
  { revalidate: 1800, tags: ['tools', 'homepage', 'filter'] }
);

// ============================================================================
// Categories for Homepage
// ============================================================================

/**
 * Get categories for homepage display.
 * Queries free_ai_tools_categories table (same source as /free-ai-tools page).
 *
 * Cache: 1 hour, tagged for revalidation
 */
export const getCategoriesForHomepage = unstable_cache(
  async (): Promise<CategoryItem[]> => {
    const supabase = createAnonClient();

    const { data, error } = await supabase
      .from('free_ai_tools_categories')
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
      icon: cat.icon || '🔧',
      toolCount: cat.tool_count ?? 0,
      color: '#F3F4F6',
    }));
  },
  ['homepage-categories'],
  { revalidate: 3600, tags: ['categories', 'homepage'] }
);

// ============================================================================
// My Tools for Homepage (Default Tools)
// ============================================================================

/**
 * Get "My Tools" for homepage display.
 * Fetches from the configured default_my_tools table.
 * Transforms to MyTool format expected by MyToolsSection component.
 *
 * Cache: 1 hour, tagged for revalidation
 */
export const getMyToolsForHomepage = unstable_cache(
  async (): Promise<MyTool[]> => {
    const supabase = createAnonClient();

    // Query default_my_tools joined with tools table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('default_my_tools' as any)
      .select(`
        display_order,
        icon_color,
        tool_slug,
        tools!fk_default_my_tools_tool_slug (
          id, name, slug, image_url, website_url
        )
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('[homepage.service] Failed to fetch default my tools:', error);
      return [];
    }

    type DefaultMyToolRow = {
      display_order: number;
      icon_color: string | null;
      tool_slug: string;
      tools: {
        id: string;
        name: string;
        slug: string;
        image_url: string | null;
        website_url: string;
      } | null;
    };

    return ((data ?? []) as unknown as DefaultMyToolRow[])
      .filter((item) => item.tools !== null)
      .map((item) => {
        const tool = item.tools!;
        return {
          id: tool.slug,
          name: tool.name,
          icon: tool.image_url || getFaviconUrl(tool.website_url),
          url: `/tool/${tool.slug}`,
          color: item.icon_color || getColorFromString(tool.name, DEFAULT_TOOL_COLORS),
        };
      });
  },
  ['homepage-my-tools-default'],
  { revalidate: 3600, tags: ['default-my-tools', 'homepage'] }
);

// ============================================================================
// User-Specific My Tools (Favorites)
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

/**
 * Get user-specific "My Tools" for homepage display.
 * 
 * Architecture Decision (Option A):
 * - Logged-in users with favorites: Show their saved favorites
 * - Logged-in users without favorites: Fallback to popular tools
 * - Anonymous users: Show popular tools (default)
 * 
 * IMPORTANT: This function requires an authenticated Supabase client to query
 * user_favorites due to RLS policies that check auth.jwt() ->> 'email'.
 * 
 * @param userEmail - User's email address (null for anonymous users)
 * @param supabaseClient - Authenticated Supabase client with user session context
 * @returns MyTool[] - Tools in the format expected by MyToolsSection component
 */
export async function getMyToolsForUser(
  userEmail: string | null,
  supabaseClient?: SupabaseClient<Database>
): Promise<MyTool[]> {
  // If no user email, return default popular tools
  if (!userEmail) {
    return getMyToolsForHomepage();
  }

  // If no authenticated client provided, fallback to popular tools
  // (anon client won't work due to RLS policies requiring auth.jwt())
  if (!supabaseClient) {
    console.warn('[homepage.service] No authenticated client provided for user favorites, falling back to popular tools');
    return getMyToolsForHomepage();
  }

  // Get user's favorites from user_favorites table
  // RLS policy: (auth.jwt() ->> 'email'::text) = user_email
  const { data: favorites, error: favError } = await supabaseClient
    .from('user_favorites')
    .select('tool_id, tool_name, custom_icon_color, display_order')
    .eq('user_email', userEmail)
    .order('display_order', { ascending: true })
    .limit(11);

  if (favError) {
    console.error('[homepage.service] Failed to fetch user favorites:', favError);
    return getMyToolsForHomepage();
  }

  // If user has no favorites, fallback to popular tools
  if (!favorites || favorites.length === 0) {
    return getMyToolsForHomepage();
  }

  // Get tool slugs from favorites (tool_id in user_favorites is the slug)
  const toolSlugs = favorites.map((f) => f.tool_id);

  // Fetch full tool data for the favorites using anon client (public data, no RLS restriction)
  const anonSupabase = createAnonClient();
  const { data: tools, error: toolsError } = await anonSupabase
    .from('tools')
    .select('id, name, slug, image_url, website_url')
    .in('slug', toolSlugs)
    .eq('status', 'published');

  if (toolsError) {
    console.error('[homepage.service] Failed to fetch favorite tools data:', toolsError);
    return getMyToolsForHomepage();
  }

  // Create a map for quick lookup
  const toolMap = new Map(tools?.map((t) => [t.slug, t]) ?? []);

  // Map favorites to MyTool format, preserving user's display order
  const myTools: MyTool[] = [];
  for (const fav of favorites) {
    const tool = toolMap.get(fav.tool_id);
    if (tool) {
      myTools.push({
        id: tool.slug,
        name: tool.name,
        icon: tool.image_url || getFaviconUrl(tool.website_url),
        url: `/tool/${tool.slug}`,
        color: fav.custom_icon_color || getColorFromString(tool.name, DEFAULT_TOOL_COLORS),
      });
    }
  }

  // If all favorites were invalid/unpublished, fallback to popular tools
  if (myTools.length === 0) {
    return getMyToolsForHomepage();
  }

  return myTools;
}

// ============================================================================
// Platform-Based Tool Fetching
// ============================================================================

/**
 * Raw tool data type from Supabase query
 */
type RawToolData = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  image_url: string | null;
  website_url: string;
  pricing: string | null;
};

/**
 * Map raw tool data to FeaturedTool format
 */
function mapToFeaturedTools(data: RawToolData[]): FeaturedTool[] {
  return data.map((tool) => ({
    id: tool.slug,
    name: tool.name,
    icon: tool.image_url || getFaviconUrl(tool.website_url),
    iconBgColor: getColorFromString(tool.name, DEFAULT_ICON_BG_COLORS),
    description: tool.short_description || '',
    isFree: tool.pricing === 'Free',
    slug: tool.slug,
    websiteUrl: tool.website_url,
  }));
}

/**
 * Platform types supported for filtering
 */
export type ToolPlatform = 'browser-extension' | 'app' | 'discord';

/**
 * Get tools by platform type.
 * Used for browser-extension, apps, discord filters on homepage.
 * 
 * @param platform - The platform type to filter by
 * @returns Array of tools matching the platform
 */
export async function getToolsByPlatform(
  platform: ToolPlatform
): Promise<FeaturedTool[]> {
  const supabase = createAnonClient();

  const { data, error } = await supabase
    .from('tools')
    .select('id, name, slug, short_description, image_url, website_url, pricing')
    .eq('platform', platform)
    .eq('status', 'published')
    .order('saved_count', { ascending: false })
    .limit(16);

  if (error) {
    console.error(`[homepage.service] Failed to fetch ${platform} tools:`, error);
    return [];
  }

  return mapToFeaturedTools((data ?? []) as RawToolData[]);
}
