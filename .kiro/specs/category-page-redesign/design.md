# Design Document: Category Page Redesign

## Overview

This design document outlines the architecture and implementation approach for redesigning the `/category` page. The redesign transforms the current category listing into a visually appealing, card-based grid layout with a hero section, search functionality, and responsive design. The implementation leverages existing Next.js patterns, Supabase data fetching, and the established design system.

## Architecture

The category page redesign follows a server-first architecture with client-side interactivity for search filtering:

```
┌─────────────────────────────────────────────────────────────┐
│                    Category Page (Server)                    │
│  - ISR with 3600s revalidation                              │
│  - Fetches categories from Supabase                         │
│  - Filters test/invalid categories                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  CategoryPageClient (Client)                 │
│  - Manages search state                                      │
│  - Filters categories in real-time                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────────┐  ┌──────────────┐
        │   Hero   │   │ CategoryGrid │  │  EmptyState  │
        │ Section  │   │              │  │              │
        └──────────┘   └──────────────┘  └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ CategoryCard │
                       └──────────────┘
```

## Components and Interfaces

### 1. CategoryPageHero Component

A hero section component displaying the page title, subtitle with statistics, and search input.

```typescript
interface CategoryPageHeroProps {
  totalTools: number;
  totalCategories: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function CategoryPageHero({
  totalTools,
  totalCategories,
  searchQuery,
  onSearchChange,
}: CategoryPageHeroProps): JSX.Element;
```

**Responsibilities:**
- Display "Explore AI Tool Categories" title
- Show formatted tool and category counts in subtitle
- Render search input with onChange handler
- Apply purple gradient background using `purple-600` consistent with site theme
- Use existing site font family and size scale for typography consistency

### 2. CategoryCard Component

A card component displaying individual category information with hover effects.

```typescript
interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    toolCount: number;
    icon?: string;
  };
}

function CategoryCard({ category }: CategoryCardProps): JSX.Element;
```

**Responsibilities:**
- Display category icon/emoji prominently
- Show category name in bold
- Format and display tool count with thousands separators
- Apply hover effects (shadow, scale) with CSS transition duration ≤200ms
- Link to `/category/[slug]`

### 3. CategoryGrid Component

A responsive grid container for category cards.

```typescript
interface CategoryGridProps {
  categories: Category[];
}

function CategoryGrid({ categories }: CategoryGridProps): JSX.Element;
```

**Responsibilities:**
- Render responsive grid (4 cols desktop ≥1024px, 3 cols tablet 768-1023px, 2 cols mobile <768px)
- Maintain 24px gap between cards
- Handle empty state when no categories match search

### 4. CategoryPageClient Component

Client wrapper managing search state and filtering logic.

```typescript
interface CategoryPageClientProps {
  categories: Category[];
  totalTools: number;
}

function CategoryPageClient({
  categories,
  totalTools,
}: CategoryPageClientProps): JSX.Element;
```

**Responsibilities:**
- Manage search query state
- Filter categories based on search term (case-insensitive)
- Render hero, grid, and empty state components

### 5. CategoryCardSkeleton Component

Loading skeleton for category cards displayed during data fetching.

```typescript
function CategoryCardSkeleton(): JSX.Element;
```

**Responsibilities:**
- Display placeholder animation during loading
- Match dimensions of actual CategoryCard
- Provide visual feedback while ISR fetches data

## Data Fetching Strategy

The page uses Next.js Incremental Static Regeneration (ISR) for optimal performance:

```typescript
// Page-level ISR configuration
export const revalidate = 3600; // Revalidate every hour (3600 seconds)
```

**Data Fetching Approach:**
- Single Supabase query fetches all categories with tool counts
- Server-side filtering removes invalid/test categories
- Client receives pre-filtered, validated category data

## Data Models

### Category Type (Existing)

```typescript
type Category = {
  id: string;
  name: string;
  slug: string;
  count: number;
  description?: string;
  toolCount?: number;
};
```

### Filtered Category (Internal)

```typescript
interface FilteredCategory {
  id: string;
  name: string;
  slug: string;
  toolCount: number;
  icon: string;
}
```

### Category Filter Criteria

Categories are filtered using the following rules:
1. `toolCount > 0` - Must have at least one tool
2. Name must not contain "Test" (case-insensitive)
3. Name must not match timestamp patterns (e.g., `\d{10,}`)
4. Name must not be random character strings (e.g., length < 3 or all consonants)

```typescript
function isValidCategory(category: Category): boolean {
  if (!category.toolCount || category.toolCount <= 0) return false;
  
  const name = category.name.toLowerCase();
  if (name.includes('test')) return false;
  if (/^\d+$/.test(category.name)) return false;
  if (/\d{10,}/.test(category.name)) return false;
  if (category.name.length < 3) return false;
  
  return true;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Category Filtering Preserves Valid Categories

*For any* set of categories, the filtering function SHALL return only categories where:
- `toolCount` is greater than 0
- Name does not contain "Test" (case-insensitive)
- Name does not match timestamp patterns (sequences of 10+ digits)
- Name is not a random character string (length ≥ 3)

**Validates: Requirements 1.1, 1.2**

### Property 2: Tool Count Formatting

*For any* positive integer representing a tool count, the formatting function SHALL produce a string with:
- Thousands separators (commas)
- The word "tools" appended (or "tool" for count of 1)

Example: `22751` → `"22,751 tools"`, `1` → `"1 tool"`

**Validates: Requirements 2.2, 3.3**

### Property 3: Category Link Generation

*For any* category with a valid slug, the generated navigation link SHALL be exactly `/category/{slug}` where `{slug}` is the category's slug property.

**Validates: Requirements 3.5**

### Property 4: Search Filter Case-Insensitivity

*For any* search term and set of categories, the filter function SHALL return all and only categories whose names contain the search term, regardless of case in either the search term or category name.

**Validates: Requirements 5.1, 5.2**

### Property 5: Search Clear Round-Trip

*For any* initial set of filtered categories, applying a search filter and then clearing the search (empty string) SHALL restore the exact original set of categories.

**Validates: Requirements 5.4**

## Error Handling

### Data Fetching Errors

- If Supabase query fails, display error boundary with retry option
- Log error to monitoring service (Sentry)
- Show user-friendly error message

### Empty State Handling

- If no categories exist after filtering: Show "No categories available" message
- If search yields no results: Show "No categories found" message with suggestion to clear search (Requirement 5.3)

### Invalid Category Data

- Categories with missing required fields (id, name, slug) are filtered out
- Categories with null/undefined toolCount treated as 0

## Visual Design Specifications

To ensure consistency with the existing site design (Requirement 6):

**Color Palette:**
- Primary accent: `purple-600`
- Secondary text: `gray-500`
- Card backgrounds: white with subtle shadows

**Typography:**
- Use existing site font family
- Follow established size scale

**Transitions:**
- All hover state transitions: ≤200ms duration
- Smooth easing functions for card interactions

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **CategoryCard rendering**: Verify card displays all required elements (icon, name, tool count)
2. **Tool count edge cases**: Test formatting for 0, 1, 999, 1000, 1000000
3. **Search empty state**: Verify "No categories found" message appears (Requirement 5.3)
4. **Category filtering edge cases**: Test boundary conditions for filter rules
5. **Hero section content**: Verify title displays "Explore AI Tool Categories" (Requirement 2.1)
6. **Search input presence**: Verify search input field exists in hero section (Requirement 2.3)
7. **Skeleton loading state**: Verify skeleton components display during loading (Requirement 7.1)
8. **Real categories display**: Verify the 12 expected Real_Categories appear (Requirement 1.3)

### Property-Based Tests

Property-based tests verify universal properties across generated inputs using **fast-check** library:

1. **Category filtering property test** (Property 1)
   - Generate random categories with various tool counts and names
   - Verify filtered output satisfies all filter criteria (toolCount > 0, no "Test", no timestamps, no random strings)
   - Minimum 100 iterations

2. **Tool count formatting property test** (Property 2)
   - Generate random positive integers
   - Verify output contains proper thousands separators and correct suffix ("tool" vs "tools")
   - Minimum 100 iterations

3. **Category link generation property test** (Property 3)
   - Generate random valid slugs
   - Verify link format is exactly `/category/{slug}`
   - Minimum 100 iterations

4. **Search filter property test** (Property 4)
   - Generate random search terms and category sets
   - Verify case-insensitive matching works correctly
   - Minimum 100 iterations

5. **Search clear round-trip property test** (Property 5)
   - Generate random category sets and search terms
   - Apply search, then clear, verify original set restored
   - Minimum 100 iterations

### Test Configuration

```typescript
// vitest.config.ts - property test settings
export default defineConfig({
  test: {
    // Property tests run with 100 iterations minimum
    testTimeout: 30000, // Allow time for property tests
  },
});
```

### Test Annotation Format

Each property test must include a comment referencing the design property:

```typescript
// Feature: category-page-redesign, Property 1: Category Filtering Preserves Valid Categories
// Validates: Requirements 1.1, 1.2
```
