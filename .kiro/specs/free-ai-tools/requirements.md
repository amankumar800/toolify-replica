# Requirements Document

## Introduction

This document specifies the requirements for implementing a "Free AI Tools" section that replicates the functionality and design of toolify.ai/free-ai-tools. The feature includes a main landing page, 22 category pages, a data scraping utility, and navigation integration with the existing site. The goal is to create an exact clone of the original website's Free AI Tools section, including all categories, tools data, and visual design.

## Pages to Implement

The Free AI Tools feature consists of 23 pages total (1 main page + 22 category pages):

### Main Page
| Page | URL Path | Source Reference |
|------|----------|------------------|
| Free AI Tools Main | `/free-ai-tools` | https://www.toolify.ai/free-ai-tools |

### Category Pages
| # | Category Name | URL Path | Source Reference |
|---|---------------|----------|------------------|
| 1 | Chatbots & Virtual Companions | `/free-ai-tools/chatbots-virtual-companions` | https://www.toolify.ai/free-ai-tools/chatbots-virtual-companions |
| 2 | Office & Productivity | `/free-ai-tools/office-productivity` | https://www.toolify.ai/free-ai-tools/office-productivity |
| 3 | Image Generation & Editing | `/free-ai-tools/image-generation-editing` | https://www.toolify.ai/free-ai-tools/image-generation-editing |
| 4 | Art & Creative Design | `/free-ai-tools/art-creative-design` | https://www.toolify.ai/free-ai-tools/art-creative-design |
| 5 | Coding & Development | `/free-ai-tools/coding-development` | https://www.toolify.ai/free-ai-tools/coding-development |
| 6 | Video & Animation | `/free-ai-tools/video-animation` | https://www.toolify.ai/free-ai-tools/video-animation |
| 7 | Education & Translation | `/free-ai-tools/education-translation` | https://www.toolify.ai/free-ai-tools/education-translation |
| 8 | Writing & Editing | `/free-ai-tools/writing-editing` | https://www.toolify.ai/free-ai-tools/writing-editing |
| 9 | Voice Generation & Conversion | `/free-ai-tools/voice-generation-conversion` | https://www.toolify.ai/free-ai-tools/voice-generation-conversion |
| 10 | Business Management | `/free-ai-tools/business-management` | https://www.toolify.ai/free-ai-tools/business-management |
| 11 | Music & Audio | `/free-ai-tools/music-audio` | https://www.toolify.ai/free-ai-tools/music-audio |
| 12 | AI Detection & Anti-Detection | `/free-ai-tools/ai-detection-anti-detection` | https://www.toolify.ai/free-ai-tools/ai-detection-anti-detection |
| 13 | Marketing & Advertising | `/free-ai-tools/marketing-advertising` | https://www.toolify.ai/free-ai-tools/marketing-advertising |
| 14 | Research & Data Analysis | `/free-ai-tools/research-data-analysis` | https://www.toolify.ai/free-ai-tools/research-data-analysis |
| 15 | Social Media | `/free-ai-tools/social-media` | https://www.toolify.ai/free-ai-tools/social-media |
| 16 | Legal & Finance | `/free-ai-tools/legal-finance` | https://www.toolify.ai/free-ai-tools/legal-finance |
| 17 | Daily Life | `/free-ai-tools/daily-life` | https://www.toolify.ai/free-ai-tools/daily-life |
| 18 | Health & Wellness | `/free-ai-tools/health-wellness` | https://www.toolify.ai/free-ai-tools/health-wellness |
| 19 | Image Analysis | `/free-ai-tools/image-analysis` | https://www.toolify.ai/free-ai-tools/image-analysis |
| 20 | Interior & Architectural Design | `/free-ai-tools/interior-architectural-design` | https://www.toolify.ai/free-ai-tools/interior-architectural-design |
| 21 | Business Research | `/free-ai-tools/business-research` | https://www.toolify.ai/free-ai-tools/business-research |
| 22 | Other | `/free-ai-tools/other-1` | https://www.toolify.ai/free-ai-tools/other-1 |

## Glossary

- **Free_AI_Tools_System**: The complete Free AI Tools feature including all pages, components, and data services
- **Category_Sidebar**: The left navigation panel displaying all 22 free AI tool categories with icons
- **Tool_Card**: A component displaying individual tool information including name, description, free tier details, and pricing
- **Subcategory_Section**: A grouped section within a category page (e.g., "Free AI Chatbot", "Free AI Character")
- **On_This_Page_Nav**: The sticky navigation on category pages showing all subcategory sections for quick jumping
- **Data_Scraper**: A utility that extracts tool and category data from the source website using Playwright browser automation
- **Featured_Tools_Panel**: The right sidebar showing featured/sponsored tools on the main page (marked with asterisk to indicate sponsored)
- **AD_Banner**: The promotional banner at the top of the sidebar showing sponsored content with avatar, name, description, and CTA
- **Loading_Skeleton**: A placeholder UI component displayed while content is being fetched
- **Scroll_Spy**: A mechanism that tracks scroll position and highlights the corresponding navigation item
- **Cache_TTL**: Time-to-live duration for cached data before it expires and requires refresh

## Requirements

### Requirement 1: Free AI Tools Navigation Button

**User Story:** As a user, I want to see a "Free AI Tools" link in the site header, so that I can easily discover and access free AI tools from any page.

#### Acceptance Criteria

1. WHEN the Header component is rendered THEN THE Free_AI_Tools_System SHALL add "Free AI Tools" as the FIRST item in the navLinks array in src/components/layout/Header.tsx with href '/free-ai-tools'
2. WHEN the MobileNav component is rendered THEN THE Free_AI_Tools_System SHALL add "Free AI Tools" as the FIRST item in the links array in src/components/layout/MobileNav.tsx with href '/free-ai-tools'
3. WHEN the "Free AI Tools" navigation link is rendered in desktop view THEN THE Free_AI_Tools_System SHALL use the same styling as other nav links: `text-sm font-medium transition-colors hover:text-[var(--primary)]` with inactive state `text-[var(--muted-foreground)]`
4. WHEN a user is on any /free-ai-tools/* page THEN THE Free_AI_Tools_System SHALL highlight the "Free AI Tools" nav link with active state `text-[var(--primary)]`
5. WHEN the "Free AI Tools" navigation link is rendered in mobile view THEN THE Free_AI_Tools_System SHALL use the same styling as other mobile nav links: `px-4 py-3 rounded-md text-sm font-medium` with active state `bg-primary/10 text-primary`
6. WHEN a user clicks the "Free AI Tools" link THEN THE Free_AI_Tools_System SHALL navigate to the /free-ai-tools page

### Requirement 2: Free AI Tools Main Page

**User Story:** As a user, I want to browse the Free AI Tools main page, so that I can understand the directory and find tools by category.

#### Acceptance Criteria

1. WHEN a user navigates to /free-ai-tools THEN THE Free_AI_Tools_System SHALL display the Category_Sidebar with all 22 categories and their icons
2. WHEN a user views the main page THEN THE Free_AI_Tools_System SHALL display a hero section with title "Find the Best Free AI Tools" and descriptive text explaining the value proposition
3. WHEN a user views the main page THEN THE Free_AI_Tools_System SHALL display "Browse Categories" and "Search Tools" call-to-action buttons
4. WHEN a user views the main page THEN THE Free_AI_Tools_System SHALL display a "Why Use Our Free AI Tools Directory?" section with three benefit points about escaping free trial traps, ending information overload, and creating with confidence
5. WHEN a user views the main page THEN THE Free_AI_Tools_System SHALL display a "Find Your Perfect Free AI Tool in 3 Steps" section with numbered steps: Define Your Need, Compare Free Plans, and Start Creating
6. WHEN a user views the main page THEN THE Free_AI_Tools_System SHALL display an FAQ accordion section titled "Free AI Tools: Frequently Asked Questions" with expandable questions and answers
7. WHEN a user views the main page THEN THE Free_AI_Tools_System SHALL display the Featured_Tools_Panel on the right side with tool cards showing tool name, image, and description
8. WHEN a user views the main page THEN THE Free_AI_Tools_System SHALL display previous/next page navigation at the bottom where "Previous Page" shows "-" (disabled) and "Next Page" links to the first category (Chatbots & Virtual Companions)
9. WHEN a user views the main page THEN THE Free_AI_Tools_System SHALL set the page title to "Find the Best Free AI Tools - Toolify"

### Requirement 3: Category Sidebar Navigation

**User Story:** As a user, I want to navigate between free AI tool categories using a sidebar, so that I can quickly find tools in my area of interest.

#### Acceptance Criteria

1. WHEN the Category_Sidebar is rendered THEN THE Free_AI_Tools_System SHALL display an "Introduction" link at the top linking to /free-ai-tools
2. WHEN the Category_Sidebar is rendered THEN THE Free_AI_Tools_System SHALL display a "Free AI Tools" heading followed by all 22 categories: Chatbots & Virtual Companions, Office & Productivity, Image Generation & Editing, Art & Creative Design, Coding & Development, Video & Animation, Education & Translation, Writing & Editing, Voice Generation & Conversion, Business Management, Music & Audio, AI Detection & Anti-Detection, Marketing & Advertising, Research & Data Analysis, Social Media, Legal & Finance, Daily Life, Health & Wellness, Image Analysis, Interior & Architectural Design, Business Research, and Other
3. WHEN a category is displayed THEN THE Free_AI_Tools_System SHALL show an icon next to each category name
4. WHEN a user clicks a category in the sidebar THEN THE Free_AI_Tools_System SHALL navigate to the corresponding category page at /free-ai-tools/[category-slug]
5. WHEN a user is on a category page THEN THE Free_AI_Tools_System SHALL highlight the active category in the sidebar
6. WHEN the sidebar is rendered on mobile devices THEN THE Free_AI_Tools_System SHALL hide the sidebar and provide a hamburger menu as specified in Requirement 19
7. WHEN the Category_Sidebar is rendered THEN THE Free_AI_Tools_System SHALL display an AD_Banner at the top showing sponsored content with avatar, name, description, and call-to-action button
8. WHEN a category in the sidebar has tools THEN THE Free_AI_Tools_System SHALL display the tool count next to the category name

### Requirement 4: Category Pages

**User Story:** As a user, I want to view all free AI tools within a specific category, so that I can compare and choose the best tool for my needs.

#### Acceptance Criteria

1. WHEN a user navigates to /free-ai-tools/[category-slug] THEN THE Free_AI_Tools_System SHALL display the category title as an H1 heading and a brief description listing subcategory types
2. WHEN a category page is rendered THEN THE Free_AI_Tools_System SHALL organize tools into Subcategory_Sections with H3 headings (e.g., "Free AI Chatbot", "Free AI Character", "Free AI Girlfriend", "Free AI Roleplay")
3. WHEN a Subcategory_Section is displayed THEN THE Free_AI_Tools_System SHALL show each tool as a list item with: tool name (linked to internal tool detail page), external link icon (linked to tool website with utm_source=toolify), and description including free tier details and pricing information
4. WHEN a user views a category page THEN THE Free_AI_Tools_System SHALL display the Category_Sidebar for navigation to other categories
5. WHEN a user views a category page THEN THE Free_AI_Tools_System SHALL display previous/next page navigation linking to adjacent categories with category names shown
6. WHEN a user views a category page THEN THE Free_AI_Tools_System SHALL display an On_This_Page_Nav sticky sidebar showing all subcategory sections for quick navigation
7. WHEN a user views a category page THEN THE Free_AI_Tools_System SHALL set the page title to "Best Free AI Tools for [Category Name] in 2025 - Toolify"

### Requirement 5: Tool Data Display

**User Story:** As a user, I want to see detailed information about each free AI tool, so that I can make informed decisions about which tools to try.

#### Acceptance Criteria

1. WHEN a Tool_Card is rendered THEN THE Free_AI_Tools_System SHALL display the tool name as a clickable link to the internal tool detail page at /tool/[tool-slug]
2. WHEN a Tool_Card is rendered THEN THE Free_AI_Tools_System SHALL display an external link icon that opens the tool's website in a new tab with utm_source=toolify parameter
3. WHEN a Tool_Card is rendered THEN THE Free_AI_Tools_System SHALL display the tool description including free tier limitations (e.g., "Free / 100 messages per day", "Free 7-day trial", "40 daily basic model accesses")
4. WHEN a Tool_Card is rendered THEN THE Free_AI_Tools_System SHALL display pricing information when available (e.g., "From $20/month", "From US$8.3/month")
5. IF tool data is missing or incomplete THEN THE Free_AI_Tools_System SHALL display a fallback state showing available data without breaking the UI layout
6. IF a tool has no external URL THEN THE Free_AI_Tools_System SHALL hide the external link icon and display only the internal link
7. WHEN a tool description exceeds 200 characters THEN THE Free_AI_Tools_System SHALL truncate with ellipsis and provide expand functionality

### Requirement 6: Data Scraping Utility (Playwright-Based)

**User Story:** As a senior data engineer, I want a robust Playwright-based data scraping utility that extracts exact tool data from all 23 source pages, so that I can populate the clone with accurate and identical information.

#### Acceptance Criteria

1. WHEN the Data_Scraper is executed THEN THE Free_AI_Tools_System SHALL use Playwright browser automation to handle JavaScript-rendered content
2. WHEN the Data_Scraper is executed THEN THE Free_AI_Tools_System SHALL systematically scrape all 23 pages (1 main page + 22 category pages) in sequence with a configurable delay between requests (default 2 seconds)
3. WHEN the Data_Scraper scrapes the main page THEN THE Free_AI_Tools_System SHALL extract: all category names, slugs, icons, featured tools with their images, descriptions, and badges
4. WHEN the Data_Scraper scrapes a category page THEN THE Free_AI_Tools_System SHALL extract: category title, description, all subcategory names, tool count per subcategory, and all tools within each subcategory
5. WHEN the Data_Scraper extracts tool data THEN THE Free_AI_Tools_System SHALL capture: tool name, internal tool slug (from /tool/[slug] link), external website URL, complete description text, free tier details, and pricing information
6. IF the Data_Scraper encounters rate limiting or errors THEN THE Free_AI_Tools_System SHALL implement retry logic with exponential backoff (max 3 retries, max wait 30 seconds) and continue processing remaining items
7. WHEN the Data_Scraper completes THEN THE Free_AI_Tools_System SHALL output structured JSON files to src/data/free-ai-tools/ directory with UTF-8 encoding
8. WHEN the Data_Scraper serializes data THEN THE Free_AI_Tools_System SHALL provide a pretty-printer for human-readable JSON output with 2-space indentation
9. WHEN the Data_Scraper reads JSON data THEN THE Free_AI_Tools_System SHALL parse and validate it against TypeScript interfaces before returning
10. WHEN the Data_Scraper is executed THEN THE Free_AI_Tools_System SHALL log progress including: pages scraped, tools extracted, errors encountered, and total execution time
11. WHEN the Data_Scraper extracts text content THEN THE Free_AI_Tools_System SHALL sanitize HTML entities and special characters to prevent XSS vulnerabilities
12. WHEN the Data_Scraper encounters duplicate tools across categories THEN THE Free_AI_Tools_System SHALL deduplicate by tool slug and track category associations

### Requirement 7: Data Service Layer

**User Story:** As a developer, I want a service layer that provides access to free AI tools data, so that components can fetch and display the data efficiently.

#### Acceptance Criteria

1. WHEN a component requests free AI tools categories THEN THE Free_AI_Tools_System SHALL return all 22 categories with their metadata including name, slug, icon, and tool count
2. WHEN a component requests tools for a specific category THEN THE Free_AI_Tools_System SHALL return all tools organized by subcategory with pagination support (default 50 tools per page)
3. WHEN a component requests featured tools THEN THE Free_AI_Tools_System SHALL return a curated list of featured tools for the main page with badge information
4. WHEN data is requested THEN THE Free_AI_Tools_System SHALL implement caching with a Cache_TTL of 1 hour and provide cache invalidation methods
5. WHEN a category slug is provided THEN THE Free_AI_Tools_System SHALL return the corresponding category data or throw a NotFoundError with appropriate message
6. WHEN a component requests subcategories for a category THEN THE Free_AI_Tools_System SHALL return all subcategory names, tool counts, and their associated tools
7. IF a data service call fails THEN THE Free_AI_Tools_System SHALL return a structured error response with error code, message, and retry guidance
8. WHEN a component requests adjacent categories THEN THE Free_AI_Tools_System SHALL return previous and next category metadata for navigation

### Requirement 8: SEO and Metadata

**User Story:** As a site owner, I want proper SEO metadata on all Free AI Tools pages, so that the pages rank well in search engines.

#### Acceptance Criteria

1. WHEN the main Free AI Tools page is rendered THEN THE Free_AI_Tools_System SHALL include the title tag "Find the Best Free AI Tools - Toolify"
2. WHEN a category page is rendered THEN THE Free_AI_Tools_System SHALL include the title tag "Best Free AI Tools for [Category Name] in 2025 - Toolify"
3. WHEN a Free AI Tools page is rendered THEN THE Free_AI_Tools_System SHALL include meta description tags describing the page content
4. WHEN a Free AI Tools page is rendered THEN THE Free_AI_Tools_System SHALL include Open Graph tags for social sharing
5. WHEN a Free AI Tools page is rendered THEN THE Free_AI_Tools_System SHALL include structured data (JSON-LD) for breadcrumbs and collection pages

### Requirement 9: Responsive Design

**User Story:** As a user, I want the Free AI Tools pages to work well on all devices, so that I can browse tools on mobile, tablet, or desktop.

#### Acceptance Criteria

1. WHEN the page is viewed on desktop THEN THE Free_AI_Tools_System SHALL display the full three-column layout (sidebar, content, featured/on-this-page)
2. WHEN the page is viewed on tablet THEN THE Free_AI_Tools_System SHALL adapt the layout to two columns or stacked sections
3. WHEN the page is viewed on mobile THEN THE Free_AI_Tools_System SHALL collapse the sidebar into a mobile navigation menu
4. WHEN the page is viewed on mobile THEN THE Free_AI_Tools_System SHALL stack content sections vertically for optimal readability
5. WHEN the page is viewed on mobile THEN THE Free_AI_Tools_System SHALL hide or collapse the On_This_Page_Nav appropriately

### Requirement 10: Visual Design Consistency

**User Story:** As a user, I want the Free AI Tools section to match the existing site's design, so that the experience is consistent and professional.

#### Acceptance Criteria

1. WHEN the Free AI Tools pages are rendered THEN THE Free_AI_Tools_System SHALL use the project's existing color scheme from globals.css: primary #5800FF, background #FFFFFF, foreground #111827, muted #F3F4F6, muted-foreground #6B7280, border #E5E7EB
2. WHEN the Free AI Tools pages are rendered THEN THE Free_AI_Tools_System SHALL use the project's existing typography (line-height: 1.5) and spacing system (4px grid with --spacing-* variables)
3. WHEN the Free AI Tools pages are rendered THEN THE Free_AI_Tools_System SHALL display category icons at 20x20px that match or closely resemble the source website icons
4. WHEN the Free AI Tools pages are rendered THEN THE Free_AI_Tools_System SHALL implement hover states using `hover:text-[var(--primary)]` consistent with existing navigation
5. WHEN the FAQ section is rendered THEN THE Free_AI_Tools_System SHALL implement an accordion-style interaction where only one question can be expanded at a time
6. WHEN the FAQ accordion item is clicked THEN THE Free_AI_Tools_System SHALL animate the expand/collapse with a 300ms ease-in-out transition
7. WHEN buttons are rendered THEN THE Free_AI_Tools_System SHALL use the existing Button component from src/components/ui/button.tsx with appropriate variants (default, outline, ghost)

### Requirement 11: On This Page Navigation

**User Story:** As a user, I want to quickly jump to specific subcategories within a category page, so that I can find relevant tools faster.

#### Acceptance Criteria

1. WHEN a category page is rendered THEN THE Free_AI_Tools_System SHALL display an On_This_Page_Nav component showing "On this page" heading with all subcategory names
2. WHEN the On_This_Page_Nav is rendered THEN THE Free_AI_Tools_System SHALL list all subcategory section names as clickable links with tool counts in parentheses
3. WHEN a user clicks a subcategory link in On_This_Page_Nav THEN THE Free_AI_Tools_System SHALL smooth scroll to that section with an 80px offset to account for sticky header
4. WHILE the user scrolls through the page THEN THE Free_AI_Tools_System SHALL use Scroll_Spy with 100px threshold to highlight the currently visible subcategory in the On_This_Page_Nav
5. WHEN the On_This_Page_Nav is rendered on desktop THEN THE Free_AI_Tools_System SHALL position it as a sticky sidebar on the right side with top offset of 100px
6. WHEN the On_This_Page_Nav is rendered on mobile THEN THE Free_AI_Tools_System SHALL collapse it into a dropdown menu accessible via a floating button

### Requirement 12: Search Functionality

**User Story:** As a user, I want to search for specific AI tools, so that I can quickly find tools that match my needs.

#### Acceptance Criteria

1. WHEN a user clicks the "Search Tools" button on the main page THEN THE Free_AI_Tools_System SHALL focus the search input in the header
2. WHEN a user enters a search query THEN THE Free_AI_Tools_System SHALL filter and display matching tools from the free AI tools database
3. WHEN search results are displayed THEN THE Free_AI_Tools_System SHALL show tool name, category, and brief description

### Requirement 13: Data Structure and Storage

**User Story:** As a senior data engineer, I want a well-structured data storage system with TypeScript interfaces, so that the scraped data is type-safe and maintainable.

#### Acceptance Criteria

1. WHEN data is stored THEN THE Free_AI_Tools_System SHALL use JSON files in src/data/free-ai-tools/ directory with UTF-8 encoding for version control compatibility
2. WHEN data structures are defined THEN THE Free_AI_Tools_System SHALL provide TypeScript interfaces for: Category, Subcategory, Tool, FeaturedTool, and ScrapingMetadata
3. WHEN a Category is stored THEN THE Free_AI_Tools_System SHALL include: id, name, slug, icon, description, toolCount, subcategories array, previousCategory, nextCategory, createdAt, and updatedAt timestamps
4. WHEN a Subcategory is stored THEN THE Free_AI_Tools_System SHALL include: id, name (e.g., "Free AI Chatbot"), toolCount, and tools array
5. WHEN a Tool is stored THEN THE Free_AI_Tools_System SHALL include: id, name, slug (max 100 characters, alphanumeric with hyphens), externalUrl (validated URL format), description (max 500 characters), freeTierDetails, pricing, and categoryIds array
6. WHEN a FeaturedTool is stored THEN THE Free_AI_Tools_System SHALL include: id, name, slug, imageUrl, description, badge (optional: "Free", "New", "Popular"), and displayOrder
7. WHEN data files are organized THEN THE Free_AI_Tools_System SHALL create separate files: categories.json, featured-tools.json, scraping-metadata.json, and individual category data files named by slug (e.g., chatbots-virtual-companions.json)
8. WHEN ScrapingMetadata is stored THEN THE Free_AI_Tools_System SHALL include: lastScrapedAt, totalTools, totalCategories, scrapeDurationMs, and version

### Requirement 14: Link Integrity and Accuracy

**User Story:** As a senior data engineer, I want all links to be accurate and functional, so that users can navigate seamlessly between pages and access external tools.

#### Acceptance Criteria

1. WHEN an internal tool link is rendered THEN THE Free_AI_Tools_System SHALL link to /tool/[tool-slug] using the exact slug from the source website
2. WHEN an external tool link is rendered THEN THE Free_AI_Tools_System SHALL include the utm_source=toolify parameter exactly as in the source
3. WHEN category navigation links are rendered THEN THE Free_AI_Tools_System SHALL link to /free-ai-tools/[category-slug] with correct slugs
4. WHEN previous/next navigation is rendered THEN THE Free_AI_Tools_System SHALL display the correct adjacent category names and links
5. WHEN the Introduction link is rendered THEN THE Free_AI_Tools_System SHALL link to /free-ai-tools main page
6. WHEN any link is clicked THEN THE Free_AI_Tools_System SHALL navigate to the correct destination without 404 errors
7. IF an internal tool link points to a tool that does not exist in the database THEN THE Free_AI_Tools_System SHALL redirect to a search results page with the tool name as the query

### Requirement 15: Data Accuracy and Completeness

**User Story:** As a senior data engineer, I want the scraped data to be an exact match of the source website, so that users see identical information.

#### Acceptance Criteria

1. WHEN tool names are displayed THEN THE Free_AI_Tools_System SHALL show the exact tool name as it appears on the source website
2. WHEN tool descriptions are displayed THEN THE Free_AI_Tools_System SHALL show the complete description including free tier details and pricing exactly as formatted on the source
3. WHEN subcategories are displayed THEN THE Free_AI_Tools_System SHALL maintain the exact grouping and naming (e.g., "Free AI Chatbot", "Free AI Character", "Free AI Girlfriend")
4. WHEN tools are listed within subcategories THEN THE Free_AI_Tools_System SHALL preserve the original ordering from the source website
5. WHEN category descriptions are displayed THEN THE Free_AI_Tools_System SHALL show the exact subcategory list (e.g., "AI Chatbot, AI Character, AI Girlfriend, AI Roleplay...")
6. WHEN featured tools are displayed THEN THE Free_AI_Tools_System SHALL show the same tools with identical names, images, and descriptions as the source
7. WHEN FAQ content is displayed THEN THE Free_AI_Tools_System SHALL show the exact questions and answers from the source website

### Requirement 16: Accessibility (WCAG 2.1 AA Compliance)

**User Story:** As a user with disabilities, I want the Free AI Tools pages to be accessible, so that I can navigate and use the feature with assistive technologies.

#### Acceptance Criteria

1. WHEN interactive elements are rendered THEN THE Free_AI_Tools_System SHALL provide appropriate ARIA labels and roles for screen readers
2. WHEN the Category_Sidebar is rendered THEN THE Free_AI_Tools_System SHALL support full keyboard navigation with visible focus indicators
3. WHEN the FAQ accordion is rendered THEN THE Free_AI_Tools_System SHALL implement proper ARIA expanded/collapsed states and keyboard controls (Enter/Space to toggle)
4. WHEN color is used to convey information THEN THE Free_AI_Tools_System SHALL ensure a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text
5. WHEN focus moves to a new section THEN THE Free_AI_Tools_System SHALL manage focus appropriately and announce changes to screen readers
6. WHEN images are displayed THEN THE Free_AI_Tools_System SHALL provide meaningful alt text for tool icons and category icons
7. WHEN the mobile navigation menu opens THEN THE Free_AI_Tools_System SHALL trap focus within the menu until closed

### Requirement 17: Loading States and Skeleton UI

**User Story:** As a user, I want to see loading indicators while content is being fetched, so that I understand the page is working and not broken.

#### Acceptance Criteria

1. WHEN a page is loading THEN THE Free_AI_Tools_System SHALL display Loading_Skeleton components that match the layout of the actual content
2. WHEN the Category_Sidebar is loading THEN THE Free_AI_Tools_System SHALL display skeleton placeholders for each category item
3. WHEN tool data is loading THEN THE Free_AI_Tools_System SHALL display skeleton cards matching the Tool_Card dimensions
4. WHEN a page transition occurs THEN THE Free_AI_Tools_System SHALL show a subtle loading indicator in the navigation area
5. WHEN content fails to load after 10 seconds THEN THE Free_AI_Tools_System SHALL display a timeout message with retry option

### Requirement 18: Error Handling and Edge Cases

**User Story:** As a user, I want graceful error handling when things go wrong, so that I can understand what happened and take appropriate action.

#### Acceptance Criteria

1. IF a user navigates to an invalid category slug THEN THE Free_AI_Tools_System SHALL display a 404 page with suggestions for valid categories
2. IF a network error occurs while fetching data THEN THE Free_AI_Tools_System SHALL display an error message with a retry button
3. IF a category has no tools THEN THE Free_AI_Tools_System SHALL display an empty state message indicating no tools are available
4. IF a category has no subcategories THEN THE Free_AI_Tools_System SHALL display tools in a flat list without subcategory headers
5. IF an image fails to load THEN THE Free_AI_Tools_System SHALL display a fallback placeholder image
6. IF the search returns no results THEN THE Free_AI_Tools_System SHALL display suggestions for alternative search terms or popular categories

### Requirement 19: Mobile Navigation

**User Story:** As a mobile user, I want an intuitive navigation experience, so that I can easily browse categories and tools on smaller screens.

#### Acceptance Criteria

1. WHEN the page is viewed on mobile (viewport width less than 768px) THEN THE Free_AI_Tools_System SHALL display a hamburger menu icon in the header
2. WHEN the hamburger menu is clicked THEN THE Free_AI_Tools_System SHALL open a slide-out drawer containing the Category_Sidebar content
3. WHEN the drawer is open THEN THE Free_AI_Tools_System SHALL display a close button and allow closing by tapping outside the drawer
4. WHEN a category is selected from the mobile drawer THEN THE Free_AI_Tools_System SHALL close the drawer and navigate to the selected category
5. WHEN the mobile drawer is open THEN THE Free_AI_Tools_System SHALL prevent body scrolling to focus user attention on navigation

### Requirement 20: Performance and Optimization

**User Story:** As a user, I want the Free AI Tools pages to load quickly and perform well, so that I have a smooth browsing experience.

#### Acceptance Criteria

1. WHEN images are rendered THEN THE Free_AI_Tools_System SHALL implement lazy loading for images below the fold
2. WHEN images are served THEN THE Free_AI_Tools_System SHALL use Next.js Image component with automatic WebP conversion and responsive srcset
3. WHEN category pages are built THEN THE Free_AI_Tools_System SHALL use Static Site Generation (SSG) with Incremental Static Regeneration (ISR) revalidating every 24 hours
4. WHEN the application is bundled THEN THE Free_AI_Tools_System SHALL implement route-based code splitting to minimize initial bundle size
5. WHEN pages are rendered THEN THE Free_AI_Tools_System SHALL target Core Web Vitals: LCP under 2.5s, FID under 100ms, CLS under 0.1
6. WHEN a user scrolls down a long category page THEN THE Free_AI_Tools_System SHALL display a "Back to Top" floating button after scrolling 500px

### Requirement 21: Site Integration and SEO Infrastructure

**User Story:** As a site owner, I want the Free AI Tools section to integrate seamlessly with the existing site infrastructure, so that search engines can discover and index all pages.

#### Acceptance Criteria

1. WHEN the Free AI Tools feature is deployed THEN THE Free_AI_Tools_System SHALL update sitemap.xml to include all 23 new pages with appropriate priority and changefreq values
2. WHEN the Free AI Tools pages are rendered THEN THE Free_AI_Tools_System SHALL use the existing Header component from src/components/layout/Header.tsx and Footer component from src/components/layout/Footer.tsx via the site layout at src/app/(site)/layout.tsx
3. WHEN canonical URLs are set THEN THE Free_AI_Tools_System SHALL use the format https://[domain]/free-ai-tools/[category-slug]
4. WHEN the scraper utility is created THEN THE Free_AI_Tools_System SHALL place it in scripts/scrape-free-ai-tools.ts with a corresponding npm script "scrape:free-ai-tools"
5. WHEN breadcrumb navigation is rendered THEN THE Free_AI_Tools_System SHALL display: Home > Free AI Tools > [Category Name] on category pages
