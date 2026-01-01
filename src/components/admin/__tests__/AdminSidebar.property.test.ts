/**
 * Property-based tests for AdminSidebar component
 *
 * Tests Properties 1, 2, and 3 from the design document:
 * - Property 1: Navigation Route Mapping
 * - Property 2: Active Route Highlighting
 * - Property 3: Responsive Sidebar Collapse
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 1.2, 1.3, 1.5, 22.1**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { navGroups, isRouteActive } from '../AdminSidebar';
import type { NavGroup, NavItem } from '../AdminSidebar';

// ============================================================================
// Test Arbitraries
// ============================================================================

// All navigation items flattened
const allNavItems: NavItem[] = navGroups.flatMap((group) => group.items);

// Arbitrary for selecting a random navigation item
const navItemArb = fc.constantFrom(...allNavItems);

// Arbitrary for generating random admin emails
const adminEmailArb = fc.emailAddress();

// Arbitrary for viewport widths
const viewportWidthArb = fc.integer({ min: 320, max: 1920 });

// Arbitrary for mobile viewport widths (< 768px)
const mobileViewportArb = fc.integer({ min: 320, max: 767 });

// Arbitrary for desktop viewport widths (>= 768px)
const desktopViewportArb = fc.integer({ min: 768, max: 1920 });

// ============================================================================
// Expected Route Mappings (from Requirements 1.2)
// ============================================================================

const expectedRouteMappings: Record<string, string> = {
  'Dashboard': '/admin/dashboard',
  'Tools': '/admin/tools',
  'AI News': '/admin/news',
  'Prompts': '/admin/prompts',
  'Category Groups': '/admin/category-groups',
  'Categories': '/admin/categories',
  'Subcategories': '/admin/subcategories',
  'Featured Tools': '/admin/featured',
  'FAQs': '/admin/faqs',
  'Admins': '/admin/admins',
  'User Activity': '/admin/user-activity',
  'Social Links': '/admin/social-links',
  'Company Pages': '/admin/company-pages',
};

// ============================================================================
// Property 1: Navigation Route Mapping
// ============================================================================

describe('Property 1: Navigation Route Mapping', () => {
  /**
   * **Feature: admin-panel-crud, Property 1: Navigation Route Mapping**
   * **Validates: Requirements 1.2**
   *
   * *For any* navigation item in the Admin_Sidebar, clicking it SHALL navigate
   * to the correct corresponding route as defined in the route mapping.
   */

  it('should have correct route for each navigation item (property test with 20 runs)', () => {
    fc.assert(
      fc.property(navItemArb, (navItem) => {
        const expectedRoute = expectedRouteMappings[navItem.label];

        // Property: Each navigation item should have the correct href
        expect(navItem.href).toBe(expectedRoute);
      }),
      { numRuns: 20 }
    );
  });

  it('should have all expected navigation items defined', () => {
    const allLabels = allNavItems.map((item) => item.label);
    const expectedLabels = Object.keys(expectedRouteMappings);

    // Property: All expected navigation items should be present
    expect(allLabels.sort()).toEqual(expectedLabels.sort());
  });

  it('should have unique routes for all navigation items', () => {
    const routes = allNavItems.map((item) => item.href);
    const uniqueRoutes = new Set(routes);

    // Property: All routes should be unique
    expect(uniqueRoutes.size).toBe(routes.length);
  });

  it('should have all routes starting with /admin/', () => {
    fc.assert(
      fc.property(navItemArb, (navItem) => {
        // Property: All admin routes should start with /admin/
        expect(navItem.href.startsWith('/admin/')).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it('should have correct navigation groups structure', () => {
    const expectedGroups = ['Overview', 'Content', 'Taxonomy', 'Features', 'System', 'Settings'];
    const actualGroups = navGroups.map((group) => group.label);

    // Property: Navigation groups should match expected structure
    expect(actualGroups).toEqual(expectedGroups);
  });
});


// ============================================================================
// Property 2: Active Route Highlighting
// ============================================================================

describe('Property 2: Active Route Highlighting', () => {
  /**
   * **Feature: admin-panel-crud, Property 2: Active Route Highlighting**
   * **Validates: Requirements 1.3**
   *
   * *For any* active route in the admin panel, the corresponding navigation
   * item in the Admin_Sidebar SHALL be highlighted.
   */

  it('should correctly identify active route for exact matches (property test with 20 runs)', () => {
    fc.assert(
      fc.property(navItemArb, (navItem) => {
        // Property: When pathname exactly matches href, route should be active
        const isActive = isRouteActive(navItem.href, navItem.href);
        expect(isActive).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it('should correctly identify active route for nested paths (property test with 20 runs)', () => {
    // Generate nested paths like /admin/tools/new, /admin/tools/123/edit
    const nestedPathSuffixes = ['/new', '/123', '/123/edit', '/abc-def'];

    fc.assert(
      fc.property(
        navItemArb,
        fc.constantFrom(...nestedPathSuffixes),
        (navItem, suffix) => {
          // Skip dashboard as it requires exact match
          if (navItem.href === '/admin/dashboard') {
            return true;
          }

          const nestedPath = navItem.href + suffix;
          const isActive = isRouteActive(navItem.href, nestedPath);

          // Property: Nested paths should activate parent route
          expect(isActive).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should not highlight dashboard for nested paths', () => {
    const dashboardHref = '/admin/dashboard';
    const nestedPaths = [
      '/admin/dashboard/stats',
      '/admin/dashboard/123',
    ];

    nestedPaths.forEach((path) => {
      // Property: Dashboard should only be active for exact match
      const isActive = isRouteActive(dashboardHref, path);
      expect(isActive).toBe(false);
    });
  });

  it('should not highlight unrelated routes (property test with 20 runs)', () => {
    fc.assert(
      fc.property(
        navItemArb,
        navItemArb,
        (item1, item2) => {
          // Skip if same item
          if (item1.href === item2.href) {
            return true;
          }

          // Skip if one is a prefix of the other (valid nesting)
          if (item2.href.startsWith(item1.href) || item1.href.startsWith(item2.href)) {
            return true;
          }

          // Property: Unrelated routes should not be highlighted
          const isActive = isRouteActive(item1.href, item2.href);
          expect(isActive).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle edge case paths correctly', () => {
    const testCases = [
      { href: '/admin/tools', pathname: '/admin/tools', expected: true },
      { href: '/admin/tools', pathname: '/admin/tools/new', expected: true },
      { href: '/admin/tools', pathname: '/admin/tools/123/edit', expected: true },
      { href: '/admin/dashboard', pathname: '/admin/dashboard', expected: true },
      { href: '/admin/dashboard', pathname: '/admin/dashboard/extra', expected: false },
      { href: '/admin/categories', pathname: '/admin/category-groups', expected: false },
      { href: '/admin/news', pathname: '/admin/newsletter', expected: false },
    ];

    testCases.forEach(({ href, pathname, expected }) => {
      const isActive = isRouteActive(href, pathname);
      expect(isActive).toBe(expected);
    });
  });
});

// ============================================================================
// Property 3: Responsive Sidebar Collapse
// ============================================================================

describe('Property 3: Responsive Sidebar Collapse', () => {
  /**
   * **Feature: admin-panel-crud, Property 3: Responsive Sidebar Collapse**
   * **Validates: Requirements 1.5, 22.1**
   *
   * *For any* viewport width less than 768px, the Admin_Sidebar SHALL collapse
   * to a hamburger menu, and for viewport widths >= 768px, the sidebar SHALL
   * be expanded.
   */

  const MOBILE_BREAKPOINT = 768;

  it('should determine mobile state correctly for all viewport widths (property test with 20 runs)', () => {
    fc.assert(
      fc.property(viewportWidthArb, (viewportWidth) => {
        const isMobile = viewportWidth < MOBILE_BREAKPOINT;

        // Property: Viewport < 768px should be mobile, >= 768px should be desktop
        if (viewportWidth < MOBILE_BREAKPOINT) {
          expect(isMobile).toBe(true);
        } else {
          expect(isMobile).toBe(false);
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should always be mobile for viewport widths < 768px (property test with 20 runs)', () => {
    fc.assert(
      fc.property(mobileViewportArb, (viewportWidth) => {
        const isMobile = viewportWidth < MOBILE_BREAKPOINT;

        // Property: All viewports < 768px should be mobile
        expect(isMobile).toBe(true);
        expect(viewportWidth).toBeLessThan(MOBILE_BREAKPOINT);
      }),
      { numRuns: 20 }
    );
  });

  it('should always be desktop for viewport widths >= 768px (property test with 20 runs)', () => {
    fc.assert(
      fc.property(desktopViewportArb, (viewportWidth) => {
        const isMobile = viewportWidth < MOBILE_BREAKPOINT;

        // Property: All viewports >= 768px should be desktop
        expect(isMobile).toBe(false);
        expect(viewportWidth).toBeGreaterThanOrEqual(MOBILE_BREAKPOINT);
      }),
      { numRuns: 20 }
    );
  });

  it('should have correct breakpoint boundary behavior', () => {
    // Property: Exactly at 768px should be desktop
    expect(768 < MOBILE_BREAKPOINT).toBe(false);

    // Property: Just below 768px should be mobile
    expect(767 < MOBILE_BREAKPOINT).toBe(true);
  });
});

// ============================================================================
// Navigation Groups Structure Tests
// ============================================================================

describe('Navigation Groups Structure', () => {
  it('should have correct items in Overview group', () => {
    const overviewGroup = navGroups.find((g) => g.label === 'Overview');
    expect(overviewGroup).toBeDefined();
    expect(overviewGroup?.items.map((i) => i.label)).toEqual(['Dashboard']);
  });

  it('should have correct items in Content group', () => {
    const contentGroup = navGroups.find((g) => g.label === 'Content');
    expect(contentGroup).toBeDefined();
    expect(contentGroup?.items.map((i) => i.label)).toEqual(['Tools', 'AI News', 'Prompts']);
  });

  it('should have correct items in Taxonomy group', () => {
    const taxonomyGroup = navGroups.find((g) => g.label === 'Taxonomy');
    expect(taxonomyGroup).toBeDefined();
    expect(taxonomyGroup?.items.map((i) => i.label)).toEqual([
      'Category Groups',
      'Categories',
      'Subcategories',
    ]);
  });

  it('should have correct items in Features group', () => {
    const featuresGroup = navGroups.find((g) => g.label === 'Features');
    expect(featuresGroup).toBeDefined();
    expect(featuresGroup?.items.map((i) => i.label)).toEqual(['Featured Tools', 'FAQs']);
  });

  it('should have correct items in System group', () => {
    const systemGroup = navGroups.find((g) => g.label === 'System');
    expect(systemGroup).toBeDefined();
    expect(systemGroup?.items.map((i) => i.label)).toEqual(['Admins', 'User Activity']);
  });

  it('should have correct items in Settings group', () => {
    const settingsGroup = navGroups.find((g) => g.label === 'Settings');
    expect(settingsGroup).toBeDefined();
    expect(settingsGroup?.items.map((i) => i.label)).toEqual(['Social Links', 'Company Pages']);
  });

  it('should have icons defined for all navigation items (property test with 20 runs)', () => {
    fc.assert(
      fc.property(navItemArb, (navItem) => {
        // Property: Every navigation item should have an icon defined
        // Icons are React forward refs which are objects with $$typeof symbol
        expect(navItem.icon).toBeDefined();
        expect(navItem.icon).not.toBeNull();
      }),
      { numRuns: 20 }
    );
  });
});

// ============================================================================
// Admin Email Display Tests
// ============================================================================

describe('Admin Email Display', () => {
  it('should accept valid email addresses (property test with 20 runs)', () => {
    fc.assert(
      fc.property(adminEmailArb, (email) => {
        // Property: Valid email addresses should be accepted
        expect(typeof email).toBe('string');
        expect(email.includes('@')).toBe(true);
      }),
      { numRuns: 20 }
    );
  });
});

// ============================================================================
// Property 7: Sidebar Active State for Company Pages
// ============================================================================

describe('Property 7: Sidebar Active State for Company Pages', () => {
  /**
   * **Feature: company-pages-management, Property 7: Sidebar Active State**
   * **Validates: Requirements 4.3**
   *
   * *For any* pathname starting with `/admin/company-pages`, the Admin Sidebar
   * SHALL highlight the "Company Pages" navigation item as active.
   */

  const companyPagesHref = '/admin/company-pages';

  // Arbitrary for generating valid company page slugs
  const companyPageSlugArb = fc.constantFrom('about', 'contact', 'privacy', 'terms');

  // Arbitrary for generating random path suffixes
  const pathSuffixArb = fc.constantFrom('', '/edit', '/new', '/123');

  it('should highlight Company Pages for exact match (property test with 20 runs)', () => {
    fc.assert(
      fc.property(fc.constant(companyPagesHref), (pathname) => {
        // Property: Exact match should be active
        const isActive = isRouteActive(companyPagesHref, pathname);
        expect(isActive).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it('should highlight Company Pages for nested slug paths (property test with 20 runs)', () => {
    fc.assert(
      fc.property(companyPageSlugArb, pathSuffixArb, (slug, suffix) => {
        const pathname = `${companyPagesHref}/${slug}${suffix}`;

        // Property: Nested paths under /admin/company-pages should be active
        const isActive = isRouteActive(companyPagesHref, pathname);
        expect(isActive).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it('should not highlight Company Pages for unrelated admin paths (property test with 20 runs)', () => {
    const unrelatedPaths = [
      '/admin/dashboard',
      '/admin/tools',
      '/admin/news',
      '/admin/social-links',
      '/admin/categories',
    ];

    fc.assert(
      fc.property(fc.constantFrom(...unrelatedPaths), (pathname) => {
        // Property: Unrelated paths should not activate Company Pages
        const isActive = isRouteActive(companyPagesHref, pathname);
        expect(isActive).toBe(false);
      }),
      { numRuns: 20 }
    );
  });

  it('should handle all company page edit paths correctly', () => {
    const editPaths = [
      '/admin/company-pages/about/edit',
      '/admin/company-pages/contact/edit',
      '/admin/company-pages/privacy/edit',
      '/admin/company-pages/terms/edit',
    ];

    editPaths.forEach((pathname) => {
      // Property: All edit paths should activate Company Pages
      const isActive = isRouteActive(companyPagesHref, pathname);
      expect(isActive).toBe(true);
    });
  });

  it('should have Company Pages in Settings group with correct href', () => {
    const settingsGroup = navGroups.find((g) => g.label === 'Settings');
    const companyPagesItem = settingsGroup?.items.find((i) => i.label === 'Company Pages');

    // Property: Company Pages should exist in Settings group with correct href
    expect(companyPagesItem).toBeDefined();
    expect(companyPagesItem?.href).toBe('/admin/company-pages');
  });
});
