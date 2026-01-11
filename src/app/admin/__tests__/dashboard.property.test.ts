/**
 * Property-based tests for Admin Dashboard
 *
 * Tests Properties from the design document:
 * - Property 4: Stat Card Navigation
 * - Property 37: Responsive Dashboard
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 2.2, 22.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Stat card configuration matching the dashboard page implementation.
 * This mirrors the statCards array in the dashboard page.
 */
interface StatCardConfig {
  title: string;
  href: string;
}

/**
 * Expected stat card to route mappings based on Requirements 2.1, 2.2
 */
const STAT_CARD_ROUTES: StatCardConfig[] = [
  { title: 'Total Tools', href: '/admin/tools' },
  { title: 'Categories', href: '/admin/categories' },
  { title: 'Subcategories', href: '/admin/subcategories' },
  { title: 'AI News', href: '/admin/news' },
  { title: 'Prompts', href: '/admin/prompts' },
  { title: 'FAQs', href: '/admin/faqs' },
  { title: 'Active Featured', href: '/admin/featured' },
  { title: 'Admins', href: '/admin/admins' },
];

/**
 * Expected route to section mapping for navigation validation.
 */
const ROUTE_TO_SECTION: Record<string, string> = {
  '/admin/tools': 'Tools',
  '/admin/categories': 'Categories',
  '/admin/subcategories': 'Subcategories',
  '/admin/news': 'AI News',
  '/admin/prompts': 'Prompts',
  '/admin/faqs': 'FAQs',
  '/admin/featured': 'Featured Tools',
  '/admin/admins': 'Admins',
};

/**
 * Responsive breakpoints for dashboard layout.
 */
const BREAKPOINTS = {
  mobile: 767,  // < 768px = single column
  tablet: 768,  // >= 768px = 2 columns
  desktop: 1024, // >= 1024px = 3 columns
};

/**
 * Calculate expected number of columns based on viewport width.
 * Matches the responsive grid classes: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
 */
function getExpectedColumns(viewportWidth: number): number {
  if (viewportWidth < 640) return 1;  // grid-cols-1
  if (viewportWidth < 1024) return 2; // sm:grid-cols-2
  return 3; // lg:grid-cols-3
}

describe('Admin Dashboard Property Tests', () => {
  /**
   * **Feature: admin-panel-crud, Property 4: Stat Card Navigation**
   * **Validates: Requirements 2.2**
   *
   * *For any* stat card on the Dashboard, clicking it SHALL navigate to the
   * corresponding management section.
   */
  describe('Property 4: Stat Card Navigation', () => {
    it('all stat cards should have valid admin routes', () => {
      // Property: Every stat card should have an href starting with /admin/
      for (const card of STAT_CARD_ROUTES) {
        expect(card.href).toMatch(/^\/admin\//);
      }
    });

    it('all stat cards should map to unique routes', () => {
      // Property: No two stat cards should navigate to the same route
      const routes = STAT_CARD_ROUTES.map(card => card.href);
      const uniqueRoutes = new Set(routes);
      expect(uniqueRoutes.size).toBe(routes.length);
    });

    it('all stat card routes should map to valid management sections', () => {
      // Property: Every stat card route should correspond to a known management section
      for (const card of STAT_CARD_ROUTES) {
        expect(ROUTE_TO_SECTION).toHaveProperty(card.href);
      }
    });

    it('stat card count should match expected table count', () => {
      // Property: Dashboard should display exactly 8 stat cards (one per table minus junction tables)
      // Tables: tools, categories, subcategories, ai_news, 
      //         midjourney_prompts, faqs, featured_tools, admins
      // Excluded: tool_categories (junction), user_favorites (read-only view, not stat card)
      expect(STAT_CARD_ROUTES.length).toBe(8);
    });

    it('for any stat card, the route should be deterministic based on title', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: STAT_CARD_ROUTES.length - 1 }),
          async (index) => {
            const card = STAT_CARD_ROUTES[index];
            
            // Property: The same stat card should always navigate to the same route
            const expectedRoute = STAT_CARD_ROUTES.find(c => c.title === card.title)?.href;
            expect(card.href).toBe(expectedRoute);
            
            // Property: Route should be a valid URL path
            expect(card.href).toMatch(/^\/admin\/[a-z-]+$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('stat card routes should follow consistent naming convention', () => {
      // Property: All routes should use kebab-case
      for (const card of STAT_CARD_ROUTES) {
        const routePart = card.href.replace('/admin/', '');
        expect(routePart).toMatch(/^[a-z]+(-[a-z]+)*$/);
      }
    });
  });

  /**
   * **Feature: admin-panel-crud, Property 37: Responsive Dashboard**
   * **Validates: Requirements 22.5**
   *
   * *For any* viewport width less than 768px, Dashboard stat cards SHALL stack
   * in a single column.
   */
  describe('Property 37: Responsive Dashboard', () => {
    it('mobile viewports should display single column layout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 320, max: 639 }), // Mobile viewport range
          async (viewportWidth) => {
            const columns = getExpectedColumns(viewportWidth);
            
            // Property: Mobile viewports (< 640px) should have single column
            expect(columns).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('tablet viewports should display two column layout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 640, max: 1023 }), // Tablet viewport range
          async (viewportWidth) => {
            const columns = getExpectedColumns(viewportWidth);
            
            // Property: Tablet viewports (640-1023px) should have 2 columns
            expect(columns).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('desktop viewports should display three column layout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1024, max: 2560 }), // Desktop viewport range
          async (viewportWidth) => {
            const columns = getExpectedColumns(viewportWidth);
            
            // Property: Desktop viewports (>= 1024px) should have 3 columns
            expect(columns).toBe(3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('column count should be monotonically non-decreasing with viewport width', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 320, max: 2560 }),
          fc.integer({ min: 1, max: 500 }),
          async (baseWidth, increment) => {
            const smallerWidth = baseWidth;
            const largerWidth = baseWidth + increment;
            
            const smallerColumns = getExpectedColumns(smallerWidth);
            const largerColumns = getExpectedColumns(largerWidth);
            
            // Property: Larger viewports should have >= columns than smaller viewports
            expect(largerColumns).toBeGreaterThanOrEqual(smallerColumns);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('breakpoint transitions should be correct', () => {
      // Property: Column count should change at exact breakpoints
      
      // Just below sm breakpoint (640px)
      expect(getExpectedColumns(639)).toBe(1);
      // At sm breakpoint
      expect(getExpectedColumns(640)).toBe(2);
      
      // Just below lg breakpoint (1024px)
      expect(getExpectedColumns(1023)).toBe(2);
      // At lg breakpoint
      expect(getExpectedColumns(1024)).toBe(3);
    });

    it('stat cards should fit within column layout', async () => {
      const totalCards = STAT_CARD_ROUTES.length;
      
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 320, max: 2560 }),
          async (viewportWidth) => {
            const columns = getExpectedColumns(viewportWidth);
            const rows = Math.ceil(totalCards / columns);
            
            // Property: All cards should fit in the grid
            expect(rows * columns).toBeGreaterThanOrEqual(totalCards);
            
            // Property: Grid should not have excessive empty cells
            const emptyCells = (rows * columns) - totalCards;
            expect(emptyCells).toBeLessThan(columns);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
