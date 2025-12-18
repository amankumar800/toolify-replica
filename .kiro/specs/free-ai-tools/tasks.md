# Implementation Plan

## MCP Server Usage Guide
- **Sequential Thinking MCP**: Use for complex problem-solving, multi-step analysis, and design decisions
- **Fetch MCP**: Use for fetching external documentation, API references, or verifying external URLs
- **Playwright MCP**: Use for visual verification of UI components, testing responsive layouts, and validating rendered pages in browser

## Phase 1: Foundation and Data Layer

- [x] 1. Set up project structure and TypeScript interfaces





  - [x] 1.1 Create TypeScript interfaces and Zod schemas for Free AI Tools data models


    - Create `src/lib/types/free-ai-tools.ts` with Category, Subcategory, Tool, FeaturedTool, FAQItem, ScrapingMetadata interfaces
    - Implement Zod schemas for runtime validation (CategorySchema, ToolSchema, SubcategorySchema)
    - 🧠 **Use Sequential Thinking MCP** to analyze data model relationships and ensure schema completeness
    - 🌐 **Use Fetch MCP** to reference Zod documentation for advanced validation patterns
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 1.2 Write property test for JSON serialization round-trip

    - **Property 3: JSON Serialization Round-Trip**
    - **Validates: Requirements 6.8, 6.9**
  - [x] 1.3 Create data directory structure


    - Create `src/data/free-ai-tools/` directory
    - Create `src/data/free-ai-tools/categories/` subdirectory for individual category files
    - _Requirements: 13.1, 13.7_


- [x] 2. Implement Playwright-based data scraper



  - [x] 2.1 Create scraper script with Playwright setup

    - Create `scripts/scrape-free-ai-tools.ts` with Playwright browser automation
    - Implement configurable delay between requests (default 2 seconds)
    - Add progress logging for pages scraped, tools extracted, errors, execution time
    - 🎭 **Use Playwright MCP** to inspect source website DOM structure and identify correct selectors
    - 🧠 **Use Sequential Thinking MCP** to plan scraping strategy and handle edge cases
    - _Requirements: 6.1, 6.2, 6.10_

  - [x] 2.2 Implement main page scraping logic
    - Extract category names, slugs, icons from sidebar
    - Extract featured tools with images, descriptions, badges
    - Extract FAQ questions and answers
    - 🎭 **Use Playwright MCP** to navigate to https://www.toolify.ai/free-ai-tools and capture page snapshot for selector analysis

    - _Requirements: 6.3, 15.6, 15.7_
  - [x] 2.3 Implement category page scraping logic
    - Extract category title, description, subcategory names
    - Extract tool count per subcategory
    - Extract all tools with name, slug, external URL, description, free tier details, pricing
    - 🎭 **Use Playwright MCP** to navigate to category pages and verify DOM structure

    - 🧠 **Use Sequential Thinking MCP** to handle complex nested data extraction
    - _Requirements: 6.4, 6.5, 15.1, 15.2, 15.3, 15.4, 15.5_
  - [x] 2.4 Implement error handling and retry logic
    - Add exponential backoff (max 3 retries, max wait 30 seconds)
    - Continue processing remaining items on individual failures
    - Implement HTML entity sanitization for XSS prevention
    - Handle duplicate tools across categories by deduplicating on slug

    - 🧠 **Use Sequential Thinking MCP** to design robust error recovery strategy
    - _Requirements: 6.6, 6.11, 6.12_
  - [x] 2.5 Implement JSON output with pretty-printing
    - Output structured JSON files to `src/data/free-ai-tools/`

    - Use 2-space indentation for human-readable output
    - Include UTF-8 encoding
    - _Requirements: 6.7, 6.8, 13.1_
  - [x] 2.6 Add npm script for scraper execution

    - Add `"scrape:free-ai-tools": "npx ts-node scripts/scrape-free-ai-tools.ts"` to package.json
    - _Requirements: 21.4_



- [x] 3. Checkpoint - Verify scraper and data layer



  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Service Layer


- [x] 4. Implement Free AI Tools data service



  - [x] 4.1 Create service class with caching

    - Create `src/lib/services/free-ai-tools.service.ts`
    - Implement in-memory cache with Map and 1-hour TTL
    - Add cache invalidation methods
    - 🧠 **Use Sequential Thinking MCP** to design optimal caching strategy and TTL management
    - _Requirements: 7.4_

  - [x] 4.2 Implement category data methods
    - `getCategories()` - return all 22 categories with metadata
    - `getCategoryBySlug(slug)` - return category data or throw NotFoundError
    - `getAdjacentCategories(slug)` - return previous/next category metadata
    - _Requirements: 7.1, 7.5, 7.6, 7.8_
  - [x] 4.3 Write property test for category slug lookup


    - **Property 4: Category Slug Lookup**

    - **Validates: Requirements 7.5**
  - [x] 4.4 Implement tool and featured tools methods
    - `getToolsByCategory(slug, page, limit)` - return tools with pagination (default 50)
    - `getFeaturedTools()` - return curated featured tools list

    - `getSubcategories(categorySlug)` - return subcategories with tool counts
    - _Requirements: 7.2, 7.3, 7.6_
  - [x] 4.5 Implement search functionality
    - `searchTools(query)` - filter tools by name, description, or category (case-insensitive)
    - 🧠 **Use Sequential Thinking MCP** to design efficient search algorithm with relevance scoring
    - _Requirements: 12.2_

  - [x] 4.6 Write property test for search results relevance


    - **Property 5: Search Results Relevance**
    - **Validates: Requirements 12.2**
  - [x] 4.7 Implement error handling
    - Create FreeAIToolsError class with error codes (NOT_FOUND, PARSE_ERROR, VALIDATION_ERROR)
    - Return structured error responses with retry guidance
    - 🧠 **Use Sequential Thinking MCP** to design comprehensive error taxonomy
    - _Requirements: 7.7_

- [x] 5. Checkpoint - Verify service layer





  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: UI Components


- [x] 6. Create CategorySidebar component





  - [x] 6.1 Implement CategorySidebar with AD banner and category list

    - Create `src/components/features/free-ai-tools/CategorySidebar.tsx`
    - Display AD banner at top with avatar, name, description, CTA
    - Display "Introduction" link to /free-ai-tools
    - Display "Free AI Tools" heading with 22 category links
    - Show icons (20x20px) and tool counts next to each category
    - Implement active state highlighting
    - Hide on mobile (< 768px)
    - 🎭 **Use Playwright MCP** to verify sidebar renders correctly and responsive behavior at different breakpoints
    - 🌐 **Use Fetch MCP** to reference source website sidebar design for accuracy
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 6.2 Write property test for navigation active state detection

    - **Property 1: Navigation Active State Detection**
    - **Validates: Requirements 1.4**

- [x] 7. Create OnThisPageNav component






  - [x] 7.1 Implement OnThisPageNav with scroll spy

    - Create `src/components/features/free-ai-tools/OnThisPageNav.tsx`
    - Display "On this page" heading with subcategory links
    - Show tool counts in parentheses (e.g., "Free AI Chatbot (15)")
    - Implement smooth scroll with 80px offset for sticky header
    - Implement scroll spy with 100px threshold and 150ms debounce
    - Sticky positioning (top: 100px) on desktop
    - Collapse into floating dropdown on mobile
    - 🧠 **Use Sequential Thinking MCP** to design scroll spy algorithm with debouncing and threshold logic
    - 🎭 **Use Playwright MCP** to test scroll behavior and verify active state highlighting during scroll
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 7.2 Write property test for scroll spy section highlighting

    - **Property 8: Scroll Spy Section Highlighting**
    - **Validates: Requirements 11.4**


- [x] 8. Create FAQAccordion component





  - [x] 8.1 Implement FAQAccordion with single-open behavior

    - Create `src/components/features/free-ai-tools/FAQAccordion.tsx`
    - Single-open accordion behavior (only one expanded at a time)
    - 300ms ease-in-out animation for expand/collapse
    - ARIA expanded/collapsed states
    - Keyboard navigation (Enter/Space to toggle)
    - 🎭 **Use Playwright MCP** to verify accordion animation, ARIA states, and keyboard navigation
    - _Requirements: 10.5, 10.6, 16.3_


- [x] 9. Create FeaturedToolsPanel component





  - [x] 9.1 Implement FeaturedToolsPanel with tool cards

    - Create `src/components/features/free-ai-tools/FeaturedToolsPanel.tsx`
    - Display "Featured*" heading (asterisk indicates sponsored)
    - Tool cards with image, name, description
    - Optional badges: "Free", "New", or "Popular"
    - Clickable cards linking to /tool/[slug]
    - _Requirements: 2.7, 13.6_


- [x] 10. Create FreeAIToolListItem component



  - [x] 10.1 Implement tool list item for category pages

    - Create `src/components/features/free-ai-tools/FreeAIToolListItem.tsx`
    - Render as `<li>` element within `<ul>` list
    - Tool name as internal link to /tool/[slug]
    - External link icon opening in new tab with `rel="noopener noreferrer"`
    - External URL includes `utm_source=toolify` parameter
    - Description with free tier details and pricing
    - Truncate descriptions > 200 characters with expand/collapse
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 14.1, 14.2_

  - [x] 10.2 Write property test for tool description format preservation

    - **Property 2: Tool Description Format Preservation**
    - **Validates: Requirements 5.3, 5.4**


  - [x] 10.3 Write property test for tool description truncation
    - **Property 9: Tool Description Truncation**
    - **Validates: Requirements 5.7**

  - [x] 10.4 Write property test for external link UTM parameter

    - **Property 7: External Link UTM Parameter**
    - **Validates: Requirements 14.2**

  - [x] 10.5 Write property test for tool slug format validation


    - **Property 6: Tool Slug Format Validation**
    - **Validates: Requirements 13.5**


- [x] 11. Create PrevNextNav component





  - [x] 11.1 Implement previous/next navigation

    - Create `src/components/features/free-ai-tools/PrevNextNav.tsx`
    - Previous/Next navigation links at bottom of pages
    - Show "-" (disabled) when previous/next is null
    - Links to /free-ai-tools/[slug] for categories
    - Display category names as link text
    - _Requirements: 2.8, 4.5, 14.4_


- [x] 12. Create MobileDrawer component




  - [x] 12.1 Implement mobile navigation drawer


    - Create `src/components/features/free-ai-tools/MobileDrawer.tsx`
    - Hamburger menu icon in header on mobile (< 768px)
    - Slide-out drawer from left (transform: translateX)
    - 300ms ease-in-out transition
    - Close button (X icon) and backdrop overlay
    - Body scroll prevention when open
    - Focus trap for accessibility
    - Auto-close on category selection
    - 🧠 **Use Sequential Thinking MCP** to design focus trap logic and accessibility flow
    - 🎭 **Use Playwright MCP** to test mobile drawer at 375px viewport, verify slide animation, backdrop click, and focus trap
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 16.7_

  - [x] 12.2 Write property test for mobile drawer body scroll prevention

    - **Property 11: Mobile Drawer Body Scroll Prevention**
    - **Validates: Requirements 19.5**


- [x] 13. Create BackToTop component





  - [x] 13.1 Implement floating back-to-top button

    - Create `src/components/features/free-ai-tools/BackToTop.tsx`
    - Floating button in bottom-right corner
    - Appears after scrolling 500px
    - Smooth scroll to top on click
    - Fade in/out animation
    - Fixed positioning: bottom 24px, right 24px
    - _Requirements: 20.6_


- [x] 14. Create AdBanner component





  - [x] 14.1 Implement AD banner for sidebar

    - Create `src/components/features/free-ai-tools/AdBanner.tsx`
    - Display avatar, name, description, CTA button
    - Styled as sponsored content
    - _Requirements: 3.7_



- [x] 15. Checkpoint - Verify UI components



  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Page Implementation

- [x] 16. Create loading and error states






  - [x] 16.1 Implement loading skeleton

    - Create `src/app/(site)/free-ai-tools/loading.tsx`
    - Skeleton matching layout structure (sidebar, content, right panel)
    - Animated pulse effect using Tailwind animate-pulse
    - Timeout handling with error message after 10 seconds
    - _Requirements: 17.1, 17.2, 17.3, 17.5_

  - [x] 16.2 Implement error boundary

    - Create `src/app/(site)/free-ai-tools/error.tsx`
    - User-friendly error message with retry button
    - Suggest valid categories on 404 errors
    - Log error details for debugging
    - _Requirements: 18.1, 18.2_

- [x] 17. Implement Free AI Tools main page





  - [x] 17.1 Create main page with SSG/ISR


    - Create `src/app/(site)/free-ai-tools/page.tsx`
    - Set `revalidate = 86400` (24 hours ISR)
    - Three-column layout: Sidebar | Content | Featured Panel
    - 🎭 **Use Playwright MCP** to verify three-column layout renders correctly at desktop viewport
    - _Requirements: 2.1, 20.3_

  - [x] 17.2 Implement main page content sections

    - Hero section with title "Find the Best Free AI Tools" and CTAs
    - "Why Use" section with 3 benefit points
    - "3 Steps" section with numbered steps
    - FAQ accordion section
    - Previous/Next navigation (Previous disabled, Next → first category)
    - 🎭 **Use Playwright MCP** to compare rendered page against source website for visual accuracy
    - 🌐 **Use Fetch MCP** to reference source page content at https://www.toolify.ai/free-ai-tools
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.8_

  - [x] 17.3 Implement main page metadata

    - Title: "Find the Best Free AI Tools - Toolify"
    - Meta description, Open Graph tags
    - Canonical URL
    - JSON-LD structured data
    - 🧠 **Use Sequential Thinking MCP** to ensure JSON-LD schema is valid and complete
    - _Requirements: 2.9, 8.1, 8.3, 8.4, 8.5, 21.3_



- [x] 18. Implement category pages

  - [x] 18.1 Create category page with dynamic routing


    - Create `src/app/(site)/free-ai-tools/[slug]/page.tsx`
    - Implement `generateStaticParams()` for all 22 categories
    - Set `revalidate = 86400` (24 hours ISR)
    - 🧠 **Use Sequential Thinking MCP** to plan dynamic routing and static params generation
    - _Requirements: 20.3_


  - [x] 18.2 Implement category page layout and content
    - Three-column layout: Sidebar | Content | On This Page Nav
    - H1 category title with description
    - Subcategory sections with H3 headings (prefixed with "Free AI")
    - Tool list items (not cards)
    - Previous/Next navigation
    - BackToTop button
    - 🎭 **Use Playwright MCP** to verify category page layout, subcategory sections, and tool list rendering

    - 🌐 **Use Fetch MCP** to reference source category pages for content accuracy
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 18.3 Implement category page breadcrumb navigation
    - Display breadcrumb: Home > Free AI Tools > [Category Name]
    - Use existing Breadcrumb component
    - Current page (category name) is not linked
    - 🎭 **Use Playwright MCP** to verify breadcrumb renders correctly with proper links

    - _Requirements: 21.5_
  - [x] 18.4 Write property test for breadcrumb navigation accuracy

    - **Property 10: Breadcrumb Navigation Accuracy**
    - **Validates: Requirements 21.5**
  - [x] 18.5 Implement category page metadata



    - Title: "Best Free AI Tools for [Category Name] in 2025 - Toolify"
    - Meta description, Open Graph tags
    - Canonical URL
    - JSON-LD structured data for CollectionPage
    - 🧠 **Use Sequential Thinking MCP** to ensure CollectionPage JSON-LD schema is valid
    - _Requirements: 4.7, 8.2, 8.3, 8.4, 8.5, 21.3_



- [x] 19. Checkpoint - Verify page implementation



  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Navigation Integration and Site Updates



- [x] 20. Update site navigation



  - [x] 20.1 Add "Free AI Tools" to Header navigation
    - Update `src/components/layout/Header.tsx`
    - Add "Free AI Tools" as FIRST item in navLinks array with href '/free-ai-tools'
    - Implement active state detection for /free-ai-tools/* routes
    - 🎭 **Use Playwright MCP** to verify nav link appears first and active state works on /free-ai-tools pages

    - _Requirements: 1.1, 1.3, 1.4, 1.6_
  - [x] 20.2 Add "Free AI Tools" to MobileNav


    - Update `src/components/layout/MobileNav.tsx`
    - Add "Free AI Tools" as FIRST item in links array
    - Apply mobile nav styling with active state
    - 🎭 **Use Playwright MCP** to test mobile nav at 375px viewport width
    - _Requirements: 1.2, 1.5_


- [x] 21. Update sitemap





  - [x] 21.1 Add Free AI Tools pages to sitemap

    - Update `src/app/sitemap.ts`
    - Add main page with priority 0.8, changeFrequency 'weekly'
    - Add all 22 category pages with priority 0.7
    - _Requirements: 21.1_





- [x] 22. Implement search integration



  - [ ] 22.1 Connect search button to header search
    - "Search Tools" button on main page focuses header search input
    - Search results display tool name, category, brief description
    - Handle no results with suggestions
    - _Requirements: 12.1, 12.3, 18.6_

## Phase 6: Accessibility and Polish


- [x] 23. Implement accessibility features





  - [x] 23.1 Add ARIA labels and keyboard navigation

    - ARIA labels for all interactive elements
    - Visible focus indicators (outline: 2px solid var(--primary))
    - Keyboard navigation for sidebar (Tab, Enter/Space)
    - Focus management for mobile drawer
    - 🎭 **Use Playwright MCP** to test keyboard navigation flow (Tab through all interactive elements)
    - 🧠 **Use Sequential Thinking MCP** to audit ARIA implementation against WCAG 2.1 AA requirements
    - _Requirements: 16.1, 16.2, 16.5_

  - [x] 23.2 Add image alt text and color contrast

    - Meaningful alt text for tool icons and category icons
    - Verify 4.5:1 contrast ratio for normal text
    - Verify 3:1 contrast ratio for large text
    - 🎭 **Use Playwright MCP** to capture screenshots and verify visual accessibility
    - 🌐 **Use Fetch MCP** to reference WCAG 2.1 AA color contrast guidelines
    - _Requirements: 16.4, 16.6_




- [x] 24. Handle edge cases



  - [x] 24.1 Implement fallback states

    - Fallback for missing/incomplete tool data
    - Hide external link icon when no external URL
    - Fallback placeholder image for failed image loads
    - Empty state for categories with no tools
    - Flat list display for categories with no subcategories
    - 🧠 **Use Sequential Thinking MCP** to enumerate all edge cases and design appropriate fallbacks
    - 🎭 **Use Playwright MCP** to test fallback states by simulating missing data scenarios
    - _Requirements: 5.5, 5.6, 18.3, 18.4, 18.5_
  - [x] 24.2 Implement missing tool link handling


    - Redirect to search results page when internal tool link doesn't exist
    - 🎭 **Use Playwright MCP** to verify redirect behavior for non-existent tool slugs
    - _Requirements: 14.7_


- [x] 25. Final Checkpoint - Verify complete implementation




  - Ensure all tests pass, ask the user if questions arise.
  - 🎭 **Use Playwright MCP** to perform full end-to-end visual verification of all 23 pages
  - 🧠 **Use Sequential Thinking MCP** to create final implementation checklist against all requirements
