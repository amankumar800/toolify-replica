// ============================================
// LAYOUT CONSTANTS
// ============================================

/** Width of the right sidebar on desktop (in pixels) */
export const SIDEBAR_WIDTH = 360;

/** Number of tools to show initially before "More" button */
export const INITIAL_TOOLS_COUNT = 8;

/** Number of columns in category grid on desktop */
export const CATEGORY_GRID_COLUMNS = 4;

/** Minimum touch target size for accessibility (in pixels) */
export const MIN_TOUCH_TARGET = 44;

// ============================================
// IMAGE CONSTANTS
// ============================================

/** Fallback icon URL when tool icon fails to load */
export const FALLBACK_ICON_URL = '/images/fallback-tool-icon.svg';

/** Base64 blur placeholder for image loading */
export const BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+PC9zdmc+';

// ============================================
// SECURITY CONSTANTS
// ============================================

/** Allowed domains for external images */
export const ALLOWED_IMAGE_DOMAINS = [
    'www.google.com',
    'www.gstatic.com',
    'lh3.googleusercontent.com',
];

/**
 * Validate if URL is from an allowed domain
 */
export function isAllowedImageUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        return ALLOWED_IMAGE_DOMAINS.some(domain =>
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
        );
    } catch {
        return false;
    }
}

// ============================================
// FILTER TAB CONSTANTS
// ============================================

/** Valid filter tab IDs */
export const FILTER_TAB_IDS = [
    'today',
    'new',
    'most-saved',
    'most-used',
    'browser-extension',
    'apps',
    'discord',
] as const;

export type FilterTabId = typeof FILTER_TAB_IDS[number];

// ============================================
// SEO CONSTANTS
// ============================================

export const SEO_DEFAULTS = {
    title: 'Best AI Tools Directory & AI Tools List - Toolify',
    description: 'Discover the best AI tools and websites. 27,000+ AI tools across 450+ categories, updated daily.',
    ogImage: '/og-image.png',
};
