# Design Document: Free AI Tools Feature

## Overview

This design document outlines the technical architecture and implementation approach for the Free AI Tools feature, which replicates the functionality of toolify.ai/free-ai-tools. The feature consists of 23 pages (1 main page + 22 category pages), a Playwright-based data scraper, a data service layer, and integration with the existing site navigation.

The implementation follows Next.js 14+ App Router patterns with Static Site Generation (SSG) and Incremental Static Regeneration (ISR) for optimal performance.

## Architecture

```mermaid
graph TB
    subgraph "Data Layer"
        SC[Scraper Script<br/>scripts/scrape-free-ai-tools.ts]
        JSON[(JSON Files<br/>src/data/free-ai-tools/)]
        TS[TypeScript Interfaces<br/>src/lib/types/free-ai-tools.ts]
    end
    
    subgraph "Service Layer"
        SVC[FreeAIToolsService<br/>src/lib/services/free-ai-tools.service.ts]
        CACHE[In-Memory Cache<br/>Map + WeakRef<br/>1 hour TTL]
        ZOD[Zod Validation<br/>Runtime Type Checking]
    end
    
    subgraph "Page Layer"
        MAIN[Main Page<br/>/free-ai-tools]
        CAT[Category Pages<br/>/free-ai-tools/[slug]]
        LOAD[loading.tsx<br/>Skeleton UI]
        ERR[error.tsx<br/>Error Boundary]
    end
    
    subgraph "Component Layer"
        SIDEBAR[CategorySidebar]
        TOOLS[FreeAIToolCard]
        NAV[OnThisPageNav]
        FAQ[FAQAccordion]
        FEAT[FeaturedToolsPanel]
        PREV[PrevNextNav]
        DRAWER[MobileDrawer]
        BTT[BackToTop]
        AD[AdBanner]
    end
    
    subgraph "Existing Site"
        HEADER[Header.tsx]
        MOBILE[MobileNav.tsx]
        LAYOUT[Site Layout]
        BREAD[Breadcrumb.tsx]
    end
    
    SC -->|Playwright| JSON
    JSON --> SVC
    TS --> SVC
    SVC --> CACHE
    CACHE --> MAIN
    CACHE --> CAT
    MAIN --> SIDEBAR
    MAIN --> FAQ
    MAIN --> FEAT
    MAIN --> PREV
    MAIN --> AD
    CAT --> SIDEBAR
    CAT --> TOOLS
    CAT --> NAV
    CAT --> PREV
    CAT --> BREAD
    CAT --> BTT
    SIDEBAR --> DRAWER
    HEADER --> MAIN
    MOBILE --> MAIN
    LAYOUT --> MAIN
    LAYOUT --> CAT
    LAYOUT --> LOAD
    LAYOUT --> ERR
```

## Components and Interfaces

### 1. Navigation Integration

**Files to Modify:**
- `src/components/layout/Header.tsx` - Add "Free AI Tools" as first nav item
- `src/components/layout/MobileNav.tsx` - Add "Free AI Tools" as first nav item

**Implementation:**
```typescript
// Header.tsx - Updated navLinks array
const navLinks = [
    { href: '/free-ai-tools', label: 'Free AI Tools' }, // NEW - First position
    { href: '/Best-trending-AI-Tools', label: 'Ranking' },
    { href: '/midjourney-library', label: 'Midjourney' },
    { href: '/category', label: 'Categories' },
    { href: '/submit', label: 'Submit Tool' },
];

// Active state detection for /free-ai-tools/* routes
const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
```

### 2. New Components

#### CategorySidebar Component
**Path:** `src/components/features/free-ai-tools/CategorySidebar.tsx`

```typescript
interface CategorySidebarProps {
    categories: Category[];
    activeSlug?: string;
}
```

Features:
- AD Banner at top with avatar, name, description, CTA
- "Introduction" link to /free-ai-tools
- "Free AI Tools" heading
- 22 category links with icons and tool counts
- Active state highlighting
- Responsive: hidden on mobile, visible on desktop

#### OnThisPageNav Component
**Path:** `src/components/features/free-ai-tools/OnThisPageNav.tsx`

```typescript
interface OnThisPageNavProps {
    subcategories: Subcategory[];
}
```

**Design Rationale:** Per Requirement 11.2, the "On this page" nav shows subcategory names with tool counts in parentheses.

Features:
- "On this page" heading
- List of subcategory links with tool counts in parentheses (e.g., "Free AI Chatbot (15)")
- Scroll spy with 100px threshold and 150ms debounce
- Smooth scroll with 80px offset for sticky header
- Sticky positioning (top: 100px)
- Mobile: Collapsed into floating dropdown button (bottom-right)

#### FAQAccordion Component
**Path:** `src/components/features/free-ai-tools/FAQAccordion.tsx`

```typescript
interface FAQItem {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    items: FAQItem[];
}
```

Features:
- Single-open accordion behavior
- 300ms ease-in-out animation
- ARIA expanded/collapsed states
- Keyboard navigation (Enter/Space)

#### FeaturedToolsPanel Component
**Path:** `src/components/features/free-ai-tools/FeaturedToolsPanel.tsx`

```typescript
interface FeaturedToolsPanelProps {
    tools: FeaturedTool[];
}
```

**Design Rationale:** Per Requirement 13.6, featured tools can display "Free", "New", or "Popular" badges.

Features:
- "Featured*" heading (asterisk indicates sponsored)
- Tool cards with image, name, description
- Optional badge: "Free", "New", or "Popular" (per Requirement 13.6)
- Clickable cards linking to tool detail pages

#### FreeAIToolListItem Component
**Path:** `src/components/features/free-ai-tools/FreeAIToolListItem.tsx`

```typescript
interface FreeAIToolListItemProps {
    tool: Tool;
}
```

**Design Rationale:** Based on source website analysis, tools are displayed as list items (not cards) on category pages. Cards are only used in the Featured panel.

Features:
- Rendered as `<li>` element within a `<ul>` list
- Tool name as internal link to /tool/[slug]
- External link icon (opens in new tab with `rel="noopener noreferrer"`)
- External URL includes `utm_source=toolify` parameter
- Description format: "- Free tier / Features / More features - From $X/month"
- No images (images only appear in Featured panel)
- Description truncation: Per Requirement 5.7, descriptions exceeding 200 characters are truncated with ellipsis and provide expand/collapse functionality

#### PrevNextNav Component
**Path:** `src/components/features/free-ai-tools/PrevNextNav.tsx`

```typescript
interface PrevNextNavProps {
    previousPage: { name: string; slug: string } | null;
    nextPage: { name: string; slug: string } | null;
}
```

Features:
- Previous/Next navigation links at bottom of pages
- Previous shows "-" (disabled) when null
- Next shows "-" (disabled) when null
- Links to /free-ai-tools/[slug] for categories
- Displays category names as link text

#### MobileDrawer Component
**Path:** `src/components/features/free-ai-tools/MobileDrawer.tsx`

```typescript
interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    activeSlug?: string;
}
```

**Design Rationale:** Per Requirements 19.1-19.5, mobile navigation requires a slide-out drawer accessible via hamburger menu.

Features:
- Hamburger menu icon displayed in header on mobile (viewport < 768px) per Requirement 19.1
- Slide-out drawer from left side (transform: translateX) per Requirement 19.2
- 300ms ease-in-out transition animation
- Close button (X icon) in top-right corner per Requirement 19.3
- Backdrop overlay with onClick to close per Requirement 19.3
- Body scroll prevention when open (overflow: hidden on body) per Requirement 19.5
- Focus trap for accessibility (Tab cycles within drawer)
- Contains full Category_Sidebar content
- Auto-closes on category selection per Requirement 19.4

#### BackToTop Component
**Path:** `src/components/features/free-ai-tools/BackToTop.tsx`

```typescript
interface BackToTopProps {
    threshold?: number; // Default: 500px
}
```

**Design Rationale:** Per Requirement 20.6, a "Back to Top" floating button appears after scrolling 500px on long category pages.

Features:
- Floating button in bottom-right corner
- Appears after scrolling past threshold (default 500px per Requirement 20.6)
- Smooth scroll to top on click
- Fade in/out animation (opacity transition)
- Fixed positioning: bottom: 24px, right: 24px
- Uses existing Button component with icon variant

#### LoadingSkeleton Components
**Path:** `src/app/(site)/free-ai-tools/loading.tsx`

Features:
- Matches layout structure of actual content
- Sidebar skeleton: 22 category item placeholders
- Content skeleton: Hero section + tool card placeholders
- Animated pulse effect using Tailwind animate-pulse
- Timeout handling: Shows error message after 10 seconds

#### ErrorBoundary Component
**Path:** `src/app/(site)/free-ai-tools/error.tsx`

Features:
- Catches rendering errors in Free AI Tools pages
- Displays user-friendly error message
- Retry button to attempt re-render
- Logs error details for debugging
- Suggests valid categories on 404 errors

### 3. Page Components

#### Site Layout Integration
**Design Rationale:** Per Requirement 21.2, Free AI Tools pages use the existing site layout which includes Header and Footer components.

**Path:** Pages are placed under `src/app/(site)/free-ai-tools/` to inherit the site layout from `src/app/(site)/layout.tsx`

This ensures:
- Consistent Header component from `src/components/layout/Header.tsx`
- Consistent Footer component from `src/components/layout/Footer.tsx`
- Shared navigation and styling across all site pages

#### Main Page
**Path:** `src/app/(site)/free-ai-tools/page.tsx`

```typescript
export const revalidate = 86400; // 24 hours ISR

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Find the Best Free AI Tools - Toolify',
        description: '...',
        openGraph: { ... },
        alternates: {
            canonical: 'https://[domain]/free-ai-tools' // Per Requirement 21.3
        }
    };
}
```

Layout:
- Three-column: Sidebar | Content | Featured Panel
- Hero section with title and CTAs
- "Why Use" section with 3 benefits
- "3 Steps" section
- FAQ accordion
- Previous/Next navigation (Previous disabled, Next → first category)

#### Category Page
**Path:** `src/app/(site)/free-ai-tools/[slug]/page.tsx`

```typescript
export const revalidate = 86400; // 24 hours ISR

export async function generateStaticParams() {
    const categories = await getFreeAIToolsCategories();
    return categories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }): Promise<Metadata> {
    return {
        title: `Best Free AI Tools for ${categoryName} in 2025 - Toolify`,
        // ...
    };
}
```

Layout:
- Three-column: Sidebar | Content | On This Page Nav
- Breadcrumb navigation: Home > Free AI Tools > [Category Name] (per Requirement 21.5)
- H1 category title with description (lists subcategory types)
- Subcategory sections with H3 headings (prefixed with "Free AI", e.g., "Free AI Chatbot")
- Tool list items (not cards)
- Previous/Next navigation

**Design Rationale:** Per Requirement 21.5, breadcrumb navigation is displayed on category pages using the existing Breadcrumb component.

### 4. Breadcrumb Integration

**Design Rationale:** Per Requirement 21.5, category pages display breadcrumb navigation using the existing Breadcrumb component.

**Path:** Uses existing `src/components/ui/Breadcrumb.tsx`

```typescript
// Category page breadcrumb implementation
const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Free AI Tools', href: '/free-ai-tools' },
    { label: categoryName, href: `/free-ai-tools/${categorySlug}` }
];

<Breadcrumb items={breadcrumbItems} />
```

Features:
- Displayed at top of category pages (below header, above H1)
- Uses existing Breadcrumb component styling
- Links are navigable for SEO and user experience
- Current page (category name) is not linked

### 5. Structured Data (JSON-LD)

**Implementation:**
Add structured data for SEO without visible breadcrumbs.

```typescript
// JSON-LD for category page
const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Best Free AI Tools for ${categoryName}`,
    "description": categoryDescription,
    "url": `https://[domain]/free-ai-tools/${categorySlug}`,
    "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": toolCount,
        "itemListElement": tools.map((tool, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "SoftwareApplication",
                "name": tool.name,
                "url": `/tool/${tool.slug}`
            }
        }))
    }
};
```

## Data Models

### TypeScript Interfaces with Zod Validation
**Path:** `src/lib/types/free-ai-tools.ts`

**Design Rationale:** Using Zod for runtime type validation ensures data integrity when parsing scraped JSON files.

```typescript
import { z } from 'zod';

// Zod schemas for runtime validation
export const CategoryRefSchema = z.object({
    name: z.string(),
    slug: z.string()
});

export const ToolSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().max(100).regex(/^[a-z0-9-]+$/),
    externalUrl: z.string().url().nullable(),
    description: z.string().max(500),
    freeTierDetails: z.string().nullable(),
    pricing: z.string().nullable(),
    categoryIds: z.array(z.string())
});

export const SubcategorySchema = z.object({
    id: z.string(),
    name: z.string(), // e.g., "Free AI Chatbot"
    toolCount: z.number().int().nonnegative(),
    tools: z.array(ToolSchema)
});

export const CategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    icon: z.string(),
    description: z.string(),
    toolCount: z.number().int().nonnegative(),
    subcategories: z.array(SubcategorySchema),
    previousCategory: CategoryRefSchema.nullable(),
    nextCategory: CategoryRefSchema.nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

// TypeScript types derived from Zod schemas
export type Category = z.infer<typeof CategorySchema>;
export type Subcategory = z.infer<typeof SubcategorySchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type CategoryRef = z.infer<typeof CategoryRefSchema>;

// Legacy interface format for reference
export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    description: string;
    toolCount: number;
    subcategories: Subcategory[];
    previousCategory: CategoryRef | null;
    nextCategory: CategoryRef | null;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryRef {
    name: string;
    slug: string;
}

export interface Subcategory {
    id: string;
    name: string;
    toolCount: number;
    tools: Tool[];
}

export interface Tool {
    id: string;
    name: string;
    slug: string;
    externalUrl: string | null;
    description: string;
    freeTierDetails: string | null;
    pricing: string | null;
    categoryIds: string[];
}

export interface FeaturedTool {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    description: string;
    badge: 'Free' | 'New' | 'Popular' | null; // Per Requirement 13.6
    displayOrder: number;
}

export interface Tool {
    id: string;
    name: string;
    slug: string;
    externalUrl: string | null;
    description: string; // Format: "Free tier / Features / More - From $X/month"
    freeTierDetails: string | null;
    pricing: string | null;
    categoryIds: string[];
}

export interface ScrapingMetadata {
    lastScrapedAt: string;
    totalTools: number;
    totalCategories: number;
    scrapeDurationMs: number;
    version: string;
}

export interface FAQItem {
    question: string;
    answer: string;
}
```

### JSON File Structure
**Directory:** `src/data/free-ai-tools/`

```
src/data/free-ai-tools/
├── categories.json           # Category metadata (without tools)
├── featured-tools.json       # Featured tools for main page
├── faq.json                  # FAQ questions and answers
├── scraping-metadata.json    # Scraping run metadata
└── categories/
    ├── chatbots-virtual-companions.json
    ├── office-productivity.json
    ├── image-generation-editing.json
    └── ... (22 category files)
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Navigation Active State Detection
*For any* URL path starting with `/free-ai-tools`, the navigation component SHALL apply the active state class to the "Free AI Tools" nav link.
**Validates: Requirements 1.4**

### Property 2: Tool Description Format Preservation
*For any* tool description scraped from the source, the rendered output SHALL preserve the original format including free tier details, features, and pricing separated by " / " and " - ".
**Validates: Requirements 5.3, 5.4**

### Property 9: Tool Description Truncation
*For any* tool description exceeding 200 characters, the rendered output SHALL truncate with ellipsis and provide expand functionality that reveals the full description when activated.
**Validates: Requirements 5.7**

### Property 3: JSON Serialization Round-Trip
*For any* valid Category, Subcategory, Tool, or FeaturedTool object, serializing to JSON with the pretty-printer and then parsing back SHALL produce an equivalent object.
**Validates: Requirements 6.8, 6.9**

### Property 4: Category Slug Lookup
*For any* valid category slug from the categories list, the service SHALL return the corresponding category data. *For any* invalid slug, the service SHALL throw a NotFoundError.
**Validates: Requirements 7.5**

### Property 5: Search Results Relevance
*For any* search query, all returned tools SHALL contain the query term (case-insensitive) in either the tool name, description, or category name.
**Validates: Requirements 12.2**

### Property 6: Tool Slug Format Validation
*For any* stored tool, the slug SHALL be at most 100 characters and contain only alphanumeric characters and hyphens.
**Validates: Requirements 13.5**

### Property 7: External Link UTM Parameter
*For any* rendered external tool link, the URL SHALL contain the query parameter `utm_source=toolify`.
**Validates: Requirements 14.2**

### Property 8: Scroll Spy Section Highlighting
*For any* scroll position on a category page, exactly one subcategory in the On This Page Nav SHALL be highlighted, corresponding to the currently visible section.
**Validates: Requirements 11.4**

### Property 10: Breadcrumb Navigation Accuracy
*For any* category page, the breadcrumb navigation SHALL display the path "Home > Free AI Tools > [Category Name]" where [Category Name] matches the current category's display name.
**Validates: Requirements 21.5**

### Property 11: Mobile Drawer Body Scroll Prevention
*For any* state where the mobile drawer is open, the body element SHALL have scroll disabled (overflow: hidden) to prevent background scrolling.
**Validates: Requirements 19.5**

## Responsive Design

### Breakpoints
Following Tailwind CSS default breakpoints:
- Mobile: < 768px (md)
- Tablet: 768px - 1024px (lg)
- Desktop: > 1024px

### Layout Adaptations

**Desktop (> 1024px):**
- Three-column layout: Sidebar (240px) | Content (flex-1) | Right Panel (280px)
- CategorySidebar visible and sticky
- OnThisPageNav visible and sticky on category pages
- FeaturedToolsPanel visible on main page

**Tablet (768px - 1024px):**
- Two-column layout: Content (flex-1) | Right Panel (240px)
- CategorySidebar hidden, accessible via hamburger menu
- OnThisPageNav collapsed into floating dropdown
- FeaturedToolsPanel stacked below content on main page

**Mobile (< 768px):**
- Single-column layout
- CategorySidebar in MobileDrawer (slide-out)
- OnThisPageNav as floating dropdown button (bottom-right)
- All content sections stacked vertically
- Tool cards full-width
- BackToTop button visible after 500px scroll

### CSS Implementation
```css
/* Three-column grid */
.free-ai-tools-layout {
    display: grid;
    grid-template-columns: 240px 1fr 280px;
    gap: 24px;
}

@media (max-width: 1024px) {
    .free-ai-tools-layout {
        grid-template-columns: 1fr 240px;
    }
}

@media (max-width: 768px) {
    .free-ai-tools-layout {
        grid-template-columns: 1fr;
    }
}
```

## Accessibility (WCAG 2.1 AA Compliance)

### Keyboard Navigation
- All interactive elements focusable via Tab key
- Visible focus indicators (outline: 2px solid var(--primary))
- Enter/Space to activate buttons and links
- Escape to close mobile drawer and expanded accordions

### ARIA Implementation
```typescript
// FAQ Accordion
<button
    aria-expanded={isOpen}
    aria-controls={`faq-content-${id}`}
    onClick={toggle}
>
    {question}
</button>
<div
    id={`faq-content-${id}`}
    role="region"
    aria-labelledby={`faq-button-${id}`}
    hidden={!isOpen}
>
    {answer}
</div>

// Mobile Drawer
<div
    role="dialog"
    aria-modal="true"
    aria-label="Category navigation"
>
    {/* drawer content */}
</div>

// Category Sidebar
<nav aria-label="Free AI Tools categories">
    <ul role="list">
        {categories.map(cat => (
            <li key={cat.id}>
                <a
                    href={`/free-ai-tools/${cat.slug}`}
                    aria-current={isActive ? 'page' : undefined}
                >
                    {cat.name}
                </a>
            </li>
        ))}
    </ul>
</nav>
```

### Color Contrast
- Normal text: minimum 4.5:1 contrast ratio
- Large text (18px+ or 14px+ bold): minimum 3:1 contrast ratio
- Interactive elements: visible in both light and dark modes

### Focus Management
- Focus trapped within mobile drawer when open
- Focus returns to trigger element when drawer closes
- Skip link to main content for keyboard users

### Screen Reader Support
- Meaningful alt text for all images
- aria-label for icon-only buttons
- Live regions for dynamic content updates

## Service Layer Implementation

### Caching Strategy
**Design Rationale:** Use in-memory caching with Map for SSG/ISR builds. No external cache (Redis) needed since data is static JSON files.

```typescript
// src/lib/services/free-ai-tools.service.ts
import { CategorySchema, type Category } from '@/lib/types/free-ai-tools';

class FreeAIToolsService {
    private cache = new Map<string, { data: unknown; expiry: number }>();
    private readonly TTL = 60 * 60 * 1000; // 1 hour

    private getCached<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data as T;
        }
        this.cache.delete(key);
        return null;
    }

    private setCache<T>(key: string, data: T): void {
        this.cache.set(key, { data, expiry: Date.now() + this.TTL });
    }

    async getCategoryBySlug(slug: string): Promise<Category> {
        const cacheKey = `category:${slug}`;
        const cached = this.getCached<Category>(cacheKey);
        if (cached) return cached;

        const data = await import(`@/data/free-ai-tools/categories/${slug}.json`);
        const validated = CategorySchema.parse(data.default);
        this.setCache(cacheKey, validated);
        return validated;
    }

    invalidateCache(key?: string): void {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
}

export const freeAIToolsService = new FreeAIToolsService();
```

## Error Handling

### Data Service Errors
```typescript
class FreeAIToolsError extends Error {
    constructor(
        message: string,
        public code: 'NOT_FOUND' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR',
        public retryable: boolean
    ) {
        super(message);
        this.name = 'FreeAIToolsError';
    }
}

// Usage with Zod validation
import { ZodError } from 'zod';

try {
    const category = CategorySchema.parse(rawData);
} catch (error) {
    if (error instanceof ZodError) {
        throw new FreeAIToolsError(
            `Invalid category data: ${error.message}`,
            'VALIDATION_ERROR',
            false
        );
    }
    throw error;
}

// Not found handling
if (!category) {
    throw new FreeAIToolsError(
        `Category not found: ${slug}`,
        'NOT_FOUND',
        false
    );
}
```

### Scraper Error Handling
- Retry logic: Max 3 retries with exponential backoff (1s, 2s, 4s)
- Max wait: 30 seconds per retry
- Continue processing remaining items on individual failures
- Log all errors with page URL and error details

### Scraper DOM Selectors
**Design Rationale:** Document actual DOM structure from source for reliable scraping.

```typescript
// Main page selectors
const SELECTORS = {
    // Category sidebar
    categorySidebar: 'navigation',
    categoryLink: 'navigation a[href^="/free-ai-tools/"]',
    categoryIcon: 'img[alt]',
    
    // AD Banner
    adBanner: 'generic:has-text("AD")',
    adAvatar: 'img[alt="Avatar"]',
    adName: 'generic:near(img[alt="Avatar"])',
    adCTA: 'generic:has-text("Get Started")',
    
    // Main content
    heroTitle: 'h1',
    faqSection: 'h2:has-text("Frequently Asked Questions")',
    faqItem: 'h3',
    
    // Featured panel
    featuredHeading: 'h3:has-text("Featured")',
    featuredTool: 'generic[cursor=pointer]:has(img)',
    
    // Category page
    subcategoryHeading: 'h3',
    toolList: 'list',
    toolItem: 'listitem',
    toolInternalLink: 'link[href^="/tool/"]',
    toolExternalLink: 'link[href*="utm_source=toolify"]',
    
    // Navigation
    prevNextNav: 'generic:has-text("Previous Page")',
    onThisPage: 'generic:has-text("On this page")'
};
```

### UI Error States
- **404 Page:** Display when invalid category slug, show suggestions for valid categories
- **Network Error:** Display retry button with error message
- **Empty Category:** Display "No tools available" message
- **Image Load Failure:** Display fallback placeholder image

## Testing Strategy

### Property-Based Testing Library
**Library:** fast-check (TypeScript/JavaScript)

Configuration:
- Minimum 100 iterations per property test
- Seed logging for reproducibility

### Unit Tests
- Service layer functions (getCategories, getCategoryBySlug, searchTools)
- Component rendering (CategorySidebar, OnThisPageNav, FAQAccordion)
- Utility functions (truncateDescription, formatSlug, validateUrl)

### Property-Based Tests
Each property test will be tagged with the format:
`**Feature: free-ai-tools, Property {number}: {property_text}**`

Example:
```typescript
// **Feature: free-ai-tools, Property 3: JSON Serialization Round-Trip**
// **Validates: Requirements 6.8, 6.9**
describe('JSON Serialization Round-Trip', () => {
    it('should preserve Category data through serialize/parse cycle', () => {
        fc.assert(
            fc.property(categoryArbitrary, (category) => {
                const serialized = JSON.stringify(category, null, 2);
                const parsed = JSON.parse(serialized);
                expect(parsed).toEqual(category);
            }),
            { numRuns: 100 }
        );
    });
});
```

### Integration Tests
- Page rendering with mock data
- Navigation flow between pages
- Search functionality end-to-end

### E2E Tests (Playwright)
**Design Rationale:** Since Playwright is already used for scraping, leverage it for E2E testing.

```typescript
// e2e/free-ai-tools.spec.ts
import { test, expect } from '@playwright/test';

test('main page loads with all categories', async ({ page }) => {
    await page.goto('/free-ai-tools');
    await expect(page.locator('h1')).toContainText('Find the Best Free AI Tools');
    await expect(page.locator('nav[aria-label="Free AI Tools categories"] a')).toHaveCount(22);
});

test('category page displays tools', async ({ page }) => {
    await page.goto('/free-ai-tools/chatbots-virtual-companions');
    await expect(page.locator('h1')).toContainText('Chatbots & Virtual Companions');
    await expect(page.locator('h3')).toHaveCount.greaterThan(0);
});
```

### Accessibility Tests
- ARIA attributes verification using axe-core
- Keyboard navigation testing
- Focus management testing
- Color contrast validation

```typescript
import { checkA11y } from 'axe-playwright';

test('main page is accessible', async ({ page }) => {
    await page.goto('/free-ai-tools');
    await checkA11y(page);
});
```

## File Structure

```
src/
├── app/(site)/free-ai-tools/
│   ├── page.tsx                    # Main page
│   ├── [slug]/
│   │   └── page.tsx                # Category pages
│   ├── loading.tsx                 # Loading skeleton
│   └── error.tsx                   # Error boundary
├── components/features/free-ai-tools/
│   ├── CategorySidebar.tsx         # Left sidebar with categories
│   ├── OnThisPageNav.tsx           # Right sidebar with subcategory links
│   ├── FAQAccordion.tsx            # Expandable FAQ section
│   ├── FeaturedToolsPanel.tsx      # Featured tools right panel (main page only)
│   ├── FreeAIToolListItem.tsx      # Individual tool list item (category pages)
│   ├── PrevNextNav.tsx             # Previous/Next page navigation
│   ├── AdBanner.tsx                # Sponsored content banner
│   ├── BackToTop.tsx               # Floating scroll-to-top button
│   └── MobileDrawer.tsx            # Mobile category navigation drawer
├── lib/
│   ├── types/free-ai-tools.ts      # TypeScript interfaces with Zod schemas
│   └── services/free-ai-tools.service.ts  # Data service with caching
├── data/free-ai-tools/
│   ├── categories.json             # Category metadata (without tools)
│   ├── featured-tools.json         # Featured tools for main page
│   ├── faq.json                    # FAQ questions and answers
│   ├── scraping-metadata.json      # Scraping run metadata
│   └── categories/
│       └── [slug].json             # Individual category data files
scripts/
└── scrape-free-ai-tools.ts         # Playwright-based data scraper
```

## Dependencies

### Required NPM Packages
```json
{
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "playwright": "^1.40.0",
    "dompurify": "^3.0.0",
    "@types/dompurify": "^3.0.0",
    "fast-check": "^3.14.0"
  }
}
```

### Existing Project Dependencies (Already Installed)
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS

## Performance Considerations

### Static Site Generation
Per Requirement 20.3:
- All 23 pages generated at build time using SSG
- ISR with 24-hour revalidation (revalidate = 86400)
- `generateStaticParams` for category pages

### Image Optimization
Per Requirements 20.1 and 20.2:
- Next.js Image component with automatic WebP conversion and responsive srcset
- Lazy loading for images below the fold (Requirement 20.1)
- Responsive srcset generation for optimal delivery
- Blur placeholder for featured tool images:
```typescript
<Image
    src={tool.imageUrl}
    alt={tool.name}
    width={48}
    height={48}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    loading="lazy"
/>
```

### Code Splitting
Per Requirement 20.4:
- Route-based code splitting (automatic with App Router)
- Dynamic imports for heavy components (FAQAccordion)
- Minimized initial bundle size through code splitting

### Core Web Vitals Targets
Per Requirement 20.5:
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

## Security Considerations

### XSS Prevention
- Sanitize all scraped content using DOMPurify before storage
- Use React's built-in XSS protection for rendering
- Validate URLs before rendering external links

```typescript
import DOMPurify from 'dompurify';

function sanitizeScrapedContent(content: string): string {
    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: []
    });
}
```

### URL Validation
```typescript
function isValidExternalUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}
```

### External Link Security
All external links must include security attributes:
```typescript
<a 
    href={`${tool.externalUrl}?utm_source=toolify`}
    target="_blank"
    rel="noopener noreferrer"
>
    {/* external link icon */}
</a>
```

## Deployment Notes

### Build Process
1. Run scraper: `npm run scrape:free-ai-tools`
2. Commit JSON data files
3. Build Next.js: `npm run build`
4. Deploy

### Sitemap Updates
Per Requirement 21.1, add to `src/app/sitemap.ts`:
```typescript
// Free AI Tools pages
{ url: '/free-ai-tools', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
...categories.map(cat => ({
    url: `/free-ai-tools/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7
}))
```

### NPM Scripts
Per Requirement 21.4, add to `package.json`:
```json
{
    "scripts": {
        "scrape:free-ai-tools": "npx ts-node scripts/scrape-free-ai-tools.ts"
    }
}
```

### Canonical URLs
Per Requirement 21.3, all Free AI Tools pages use canonical URLs:
- Main page: `https://[domain]/free-ai-tools`
- Category pages: `https://[domain]/free-ai-tools/[category-slug]`
