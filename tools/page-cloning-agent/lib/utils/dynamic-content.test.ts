/**
 * Unit Tests for Dynamic Content Handler Module
 * 
 * Tests the JavaScript code generators and handler functions for:
 * - Infinite scroll handling
 * - Load more button clicking
 * - Accordion/tab expansion
 * - Pagination navigation
 * - AJAX content waiting
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 * @requirements 19.1, 19.2, 19.5, 19.6
 */

import { describe, it, expect } from 'vitest';
import {
  generateInfiniteScrollCode,
  generateLoadMoreCode,
  generateExpandSectionsCode,
  generatePaginationInfoCode,
  generateWaitForAjaxCode,
  generateLoadLazyImagesCode,
  handleInfiniteScroll,
  handleLoadMoreButtons,
  expandAllSections,
  handlePagination,
  waitForAjaxContent,
  loadLazyImages,
  mergeSelectors,
  createLoadingSequence,
  DEFAULT_SCROLL_OPTIONS,
  DEFAULT_LOAD_MORE_OPTIONS,
  DEFAULT_EXPAND_OPTIONS,
  DEFAULT_PAGINATION_OPTIONS,
  DEFAULT_WAIT_OPTIONS,
  DEFAULT_LOAD_MORE_SELECTORS,
  DEFAULT_ACCORDION_SELECTORS,
  DEFAULT_TAB_SELECTORS,
  DEFAULT_PAGINATION_SELECTORS,
} from './dynamic-content';

// =============================================================================
// Code Generator Tests
// =============================================================================

describe('Dynamic Content - Code Generators', () => {
  describe('generateInfiniteScrollCode', () => {
    it('generates valid JavaScript function string', () => {
      const code = generateInfiniteScrollCode();
      expect(code).toContain('async ()');
      expect(code).toContain('scrollBy');
      expect(code).toContain('scrollHeight');
    });

    it('uses default options when none provided', () => {
      const code = generateInfiniteScrollCode();
      expect(code).toContain(`maxScrolls = ${DEFAULT_SCROLL_OPTIONS.maxScrolls}`);
      expect(code).toContain(`scrollDistance = ${DEFAULT_SCROLL_OPTIONS.scrollDistance}`);
      expect(code).toContain(`scrollDelay = ${DEFAULT_SCROLL_OPTIONS.scrollDelay}`);
    });


    it('applies custom options', () => {
      const code = generateInfiniteScrollCode({
        maxScrolls: 100,
        scrollDistance: 1000,
        scrollDelay: 500,
        contentSelector: '.item',
      });
      expect(code).toContain('maxScrolls = 100');
      expect(code).toContain('scrollDistance = 1000');
      expect(code).toContain('scrollDelay = 500');
      expect(code).toContain("contentSelector = '.item'");
    });

    it('returns scroll result structure', () => {
      const code = generateInfiniteScrollCode();
      expect(code).toContain('scrollCount');
      expect(code).toContain('newContentLoaded');
      expect(code).toContain('initialHeight');
      expect(code).toContain('finalHeight');
    });
  });

  describe('generateLoadMoreCode', () => {
    it('generates valid JavaScript function string', () => {
      const code = generateLoadMoreCode();
      expect(code).toContain('async ()');
      expect(code).toContain('click()');
    });

    it('includes default button selectors', () => {
      const code = generateLoadMoreCode();
      expect(code).toContain('Load More');
      expect(code).toContain('Show More');
    });

    it('applies custom selectors', () => {
      const code = generateLoadMoreCode({
        buttonSelectors: ['.custom-load-more'],
      });
      expect(code).toContain('.custom-load-more');
    });

    it('returns load more result structure', () => {
      const code = generateLoadMoreCode();
      expect(code).toContain('clickCount');
      expect(code).toContain('allContentLoaded');
      expect(code).toContain('buttonFound');
    });
  });

  describe('generateExpandSectionsCode', () => {
    it('generates valid JavaScript function string', () => {
      const code = generateExpandSectionsCode();
      expect(code).toContain('async ()');
      expect(code).toContain('click()');
    });

    it('handles details elements', () => {
      const code = generateExpandSectionsCode();
      expect(code).toContain('details:not([open])');
      expect(code).toContain("setAttribute('open'");
    });

    it('returns expand result structure', () => {
      const code = generateExpandSectionsCode();
      expect(code).toContain('expandedCount');
      expect(code).toContain('accordionsExpanded');
      expect(code).toContain('tabsExpanded');
    });
  });

  describe('generatePaginationInfoCode', () => {
    it('generates valid JavaScript function string', () => {
      const code = generatePaginationInfoCode();
      expect(code).toContain('() =>');
    });

    it('detects page numbers from text', () => {
      const code = generatePaginationInfoCode();
      expect(code).toContain('currentPage');
      expect(code).toContain('totalPages');
    });

    it('returns pagination info structure', () => {
      const code = generatePaginationInfoCode();
      expect(code).toContain('hasNextButton');
      expect(code).toContain('nextButtonSelector');
      expect(code).toContain('isLastPage');
    });
  });


  describe('generateWaitForAjaxCode', () => {
    it('generates valid JavaScript function string', () => {
      const code = generateWaitForAjaxCode();
      expect(code).toContain('() =>');
      expect(code).toContain('Promise');
      expect(code).toContain('MutationObserver');
    });

    it('uses default timeout and idle time', () => {
      const code = generateWaitForAjaxCode();
      expect(code).toContain(`timeout = ${DEFAULT_WAIT_OPTIONS.timeout}`);
      expect(code).toContain(`idleTime = ${DEFAULT_WAIT_OPTIONS.idleTime}`);
    });

    it('applies custom options', () => {
      const code = generateWaitForAjaxCode({ timeout: 5000, idleTime: 1000 });
      expect(code).toContain('timeout = 5000');
      expect(code).toContain('idleTime = 1000');
    });

    it('returns wait result structure', () => {
      const code = generateWaitForAjaxCode();
      expect(code).toContain('waited');
      expect(code).toContain('timedOut');
      expect(code).toContain('duration');
    });
  });

  describe('generateLoadLazyImagesCode', () => {
    it('generates valid JavaScript function string', () => {
      const code = generateLoadLazyImagesCode();
      expect(code).toContain('async ()');
      expect(code).toContain('scrollIntoView');
    });

    it('targets lazy-loaded images', () => {
      const code = generateLoadLazyImagesCode();
      expect(code).toContain('loading="lazy"');
      expect(code).toContain('data-src');
      expect(code).toContain('data-lazy');
    });

    it('scrolls back to top after loading', () => {
      const code = generateLoadLazyImagesCode();
      expect(code).toContain('scrollTo(0, 0)');
    });
  });
});

// =============================================================================
// Handler Function Tests
// =============================================================================

describe('Dynamic Content - Handler Functions', () => {
  describe('handleInfiniteScroll', () => {
    it('returns code and parseResult function', () => {
      const handler = handleInfiniteScroll();
      expect(handler.code).toBeDefined();
      expect(typeof handler.parseResult).toBe('function');
    });

    it('parseResult handles valid result', () => {
      const handler = handleInfiniteScroll();
      const result = handler.parseResult({
        scrollCount: 10,
        newContentLoaded: true,
        initialHeight: 1000,
        finalHeight: 5000,
      });
      expect(result.scrollCount).toBe(10);
      expect(result.newContentLoaded).toBe(true);
      expect(result.initialHeight).toBe(1000);
      expect(result.finalHeight).toBe(5000);
    });

    it('parseResult handles missing fields', () => {
      const handler = handleInfiniteScroll();
      const result = handler.parseResult({});
      expect(result.scrollCount).toBe(0);
      expect(result.newContentLoaded).toBe(false);
      expect(result.initialHeight).toBe(0);
      expect(result.finalHeight).toBe(0);
    });
  });


  describe('handleLoadMoreButtons', () => {
    it('returns code and parseResult function', () => {
      const handler = handleLoadMoreButtons();
      expect(handler.code).toBeDefined();
      expect(typeof handler.parseResult).toBe('function');
    });

    it('parseResult handles valid result', () => {
      const handler = handleLoadMoreButtons();
      const result = handler.parseResult({
        clickCount: 5,
        allContentLoaded: true,
        buttonFound: true,
      });
      expect(result.clickCount).toBe(5);
      expect(result.allContentLoaded).toBe(true);
      expect(result.buttonFound).toBe(true);
    });

    it('parseResult handles missing fields', () => {
      const handler = handleLoadMoreButtons();
      const result = handler.parseResult({});
      expect(result.clickCount).toBe(0);
      expect(result.allContentLoaded).toBe(false);
      expect(result.buttonFound).toBe(false);
    });
  });

  describe('expandAllSections', () => {
    it('returns code and parseResult function', () => {
      const handler = expandAllSections();
      expect(handler.code).toBeDefined();
      expect(typeof handler.parseResult).toBe('function');
    });

    it('parseResult handles valid result', () => {
      const handler = expandAllSections();
      const result = handler.parseResult({
        expandedCount: 15,
        accordionsExpanded: 10,
        tabsExpanded: 5,
      });
      expect(result.expandedCount).toBe(15);
      expect(result.accordionsExpanded).toBe(10);
      expect(result.tabsExpanded).toBe(5);
    });

    it('parseResult handles missing fields', () => {
      const handler = expandAllSections();
      const result = handler.parseResult({});
      expect(result.expandedCount).toBe(0);
      expect(result.accordionsExpanded).toBe(0);
      expect(result.tabsExpanded).toBe(0);
    });
  });

  describe('handlePagination', () => {
    it('returns code and parseResult function', () => {
      const handler = handlePagination();
      expect(handler.code).toBeDefined();
      expect(typeof handler.parseResult).toBe('function');
    });

    it('parseResult handles valid result', () => {
      const handler = handlePagination();
      const result = handler.parseResult({
        hasNextButton: true,
        nextButtonSelector: '.next',
        currentPage: 2,
        totalPages: 10,
        isLastPage: false,
      });
      expect(result.hasNextButton).toBe(true);
      expect(result.nextButtonSelector).toBe('.next');
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(10);
      expect(result.isLastPage).toBe(false);
    });

    it('parseResult handles missing fields', () => {
      const handler = handlePagination();
      const result = handler.parseResult({});
      expect(result.hasNextButton).toBe(false);
      expect(result.nextButtonSelector).toBe(null);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(null);
      expect(result.isLastPage).toBe(false);
    });
  });


  describe('waitForAjaxContent', () => {
    it('returns code and parseResult function', () => {
      const handler = waitForAjaxContent();
      expect(handler.code).toBeDefined();
      expect(typeof handler.parseResult).toBe('function');
    });

    it('parseResult handles valid result', () => {
      const handler = waitForAjaxContent();
      const result = handler.parseResult({
        waited: true,
        timedOut: false,
        duration: 1500,
      });
      expect(result.waited).toBe(true);
      expect(result.timedOut).toBe(false);
      expect(result.duration).toBe(1500);
    });

    it('parseResult handles missing fields', () => {
      const handler = waitForAjaxContent();
      const result = handler.parseResult({});
      expect(result.waited).toBe(false);
      expect(result.timedOut).toBe(false);
      expect(result.duration).toBe(0);
    });
  });

  describe('loadLazyImages', () => {
    it('returns code and parseResult function', () => {
      const handler = loadLazyImages();
      expect(handler.code).toBeDefined();
      expect(typeof handler.parseResult).toBe('function');
    });

    it('parseResult handles valid result', () => {
      const handler = loadLazyImages();
      const result = handler.parseResult({
        imagesFound: 20,
        imagesScrolled: 20,
      });
      expect(result.imagesFound).toBe(20);
      expect(result.imagesScrolled).toBe(20);
    });

    it('parseResult handles missing fields', () => {
      const handler = loadLazyImages();
      const result = handler.parseResult({});
      expect(result.imagesFound).toBe(0);
      expect(result.imagesScrolled).toBe(0);
    });
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('Dynamic Content - Utility Functions', () => {
  describe('mergeSelectors', () => {
    it('combines custom and default selectors', () => {
      const result = mergeSelectors(['.custom'], ['.default']);
      expect(result).toContain('.custom');
      expect(result).toContain('.default');
    });

    it('removes duplicates', () => {
      const result = mergeSelectors(['.same', '.custom'], ['.same', '.default']);
      expect(result.filter(s => s === '.same').length).toBe(1);
    });

    it('preserves order with custom first', () => {
      const result = mergeSelectors(['.custom'], ['.default']);
      expect(result[0]).toBe('.custom');
    });

    it('handles empty arrays', () => {
      expect(mergeSelectors([], ['.default'])).toEqual(['.default']);
      expect(mergeSelectors(['.custom'], [])).toEqual(['.custom']);
      expect(mergeSelectors([], [])).toEqual([]);
    });
  });

  describe('createLoadingSequence', () => {
    it('creates default sequence with all operations', () => {
      const sequence = createLoadingSequence();
      const names = sequence.map(s => s.name);
      expect(names).toContain('waitForAjax');
      expect(names).toContain('expandSections');
      expect(names).toContain('infiniteScroll');
      expect(names).toContain('loadMore');
      expect(names).toContain('loadLazyImages');
      expect(names).toContain('finalWait');
    });

    it('includes handlers with code and parseResult', () => {
      const sequence = createLoadingSequence();
      for (const op of sequence) {
        expect(op.handler.code).toBeDefined();
        expect(typeof op.handler.parseResult).toBe('function');
      }
    });

    it('can disable image loading', () => {
      const sequence = createLoadingSequence({ loadImages: false });
      const names = sequence.map(s => s.name);
      expect(names).not.toContain('loadLazyImages');
    });

    it('always includes final wait', () => {
      const sequence = createLoadingSequence({ loadImages: false });
      const names = sequence.map(s => s.name);
      expect(names).toContain('finalWait');
    });
  });
});


// =============================================================================
// Default Constants Tests
// =============================================================================

describe('Dynamic Content - Default Constants', () => {
  describe('DEFAULT_LOAD_MORE_SELECTORS', () => {
    it('includes common load more button patterns', () => {
      expect(DEFAULT_LOAD_MORE_SELECTORS.length).toBeGreaterThan(0);
      const joined = DEFAULT_LOAD_MORE_SELECTORS.join(' ');
      expect(joined.toLowerCase()).toContain('load');
      expect(joined.toLowerCase()).toContain('more');
    });
  });

  describe('DEFAULT_ACCORDION_SELECTORS', () => {
    it('includes common accordion patterns', () => {
      expect(DEFAULT_ACCORDION_SELECTORS.length).toBeGreaterThan(0);
      const joined = DEFAULT_ACCORDION_SELECTORS.join(' ');
      expect(joined.toLowerCase()).toContain('accordion');
    });

    it('includes aria-expanded selectors', () => {
      const hasAriaExpanded = DEFAULT_ACCORDION_SELECTORS.some(s => 
        s.includes('aria-expanded')
      );
      expect(hasAriaExpanded).toBe(true);
    });

    it('includes details/summary pattern', () => {
      const hasDetails = DEFAULT_ACCORDION_SELECTORS.some(s => 
        s.includes('details')
      );
      expect(hasDetails).toBe(true);
    });
  });

  describe('DEFAULT_TAB_SELECTORS', () => {
    it('includes common tab patterns', () => {
      expect(DEFAULT_TAB_SELECTORS.length).toBeGreaterThan(0);
      const joined = DEFAULT_TAB_SELECTORS.join(' ');
      expect(joined.toLowerCase()).toContain('tab');
    });

    it('includes role="tab" selector', () => {
      const hasRoleTab = DEFAULT_TAB_SELECTORS.some(s => 
        s.includes('role="tab"')
      );
      expect(hasRoleTab).toBe(true);
    });
  });

  describe('DEFAULT_PAGINATION_SELECTORS', () => {
    it('includes common pagination patterns', () => {
      expect(DEFAULT_PAGINATION_SELECTORS.length).toBeGreaterThan(0);
      const joined = DEFAULT_PAGINATION_SELECTORS.join(' ');
      expect(joined.toLowerCase()).toContain('next');
    });

    it('includes aria-label selectors', () => {
      const hasAriaLabel = DEFAULT_PAGINATION_SELECTORS.some(s => 
        s.includes('aria-label')
      );
      expect(hasAriaLabel).toBe(true);
    });
  });

  describe('DEFAULT_SCROLL_OPTIONS', () => {
    it('has reasonable default values', () => {
      expect(DEFAULT_SCROLL_OPTIONS.maxScrolls).toBeGreaterThan(0);
      expect(DEFAULT_SCROLL_OPTIONS.scrollDistance).toBeGreaterThan(0);
      expect(DEFAULT_SCROLL_OPTIONS.scrollDelay).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_WAIT_OPTIONS', () => {
    it('has reasonable timeout and idle time', () => {
      expect(DEFAULT_WAIT_OPTIONS.timeout).toBeGreaterThanOrEqual(5000);
      expect(DEFAULT_WAIT_OPTIONS.idleTime).toBeGreaterThanOrEqual(100);
      expect(DEFAULT_WAIT_OPTIONS.idleTime).toBeLessThan(DEFAULT_WAIT_OPTIONS.timeout);
    });
  });
});
