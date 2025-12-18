/**
 * Dynamic Content Handler Module
 * 
 * Provides utilities for handling dynamic content during page scraping.
 * Includes functions for infinite scroll, load more buttons, accordions,
 * pagination, and AJAX content waiting.
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 * @requirements 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 2.10
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Options for infinite scroll handling
 */
export interface ScrollOptions {
  /** Maximum number of scroll iterations (default: 50) */
  maxScrolls?: number;
  /** Distance to scroll in pixels (default: 500) */
  scrollDistance?: number;
  /** Delay between scrolls in ms (default: 300) */
  scrollDelay?: number;
  /** Optional selector to check for new content */
  contentSelector?: string;
}

/**
 * Result of infinite scroll handling
 */
export interface ScrollResult {
  /** Number of scroll iterations performed */
  scrollCount: number;
  /** Whether new content was loaded */
  newContentLoaded: boolean;
  /** Initial page height before scrolling */
  initialHeight: number;
  /** Final page height after scrolling */
  finalHeight: number;
}

/**
 * Options for load more button handling
 */
export interface LoadMoreOptions {
  /** CSS selectors for load more buttons */
  buttonSelectors?: string[];
  /** Maximum number of clicks (default: 100) */
  maxClicks?: number;
  /** Delay between clicks in ms (default: 500) */
  clickDelay?: number;
}

/**
 * Result of load more button handling
 */
export interface LoadMoreResult {
  /** Number of button clicks performed */
  clickCount: number;
  /** Whether all content was loaded */
  allContentLoaded: boolean;
  /** Whether a load more button was found */
  buttonFound: boolean;
}

/**
 * Options for expanding sections (accordions, tabs)
 */
export interface ExpandOptions {
  /** CSS selectors for accordion triggers */
  accordionSelectors?: string[];
  /** CSS selectors for tab triggers */
  tabSelectors?: string[];
  /** Delay between expansions in ms (default: 200) */
  expandDelay?: number;
}


/**
 * Result of expanding sections
 */
export interface ExpandResult {
  /** Total number of sections expanded */
  expandedCount: number;
  /** Number of accordions expanded */
  accordionsExpanded: number;
  /** Number of tabs expanded */
  tabsExpanded: number;
}

/**
 * Options for pagination handling
 */
export interface PaginationOptions {
  /** CSS selector for next page button */
  nextButtonSelector?: string;
  /** CSS selector for page number elements */
  pageNumberSelector?: string;
  /** Maximum number of pages to visit (default: 100) */
  maxPages?: number;
  /** Delay between page navigations in ms (default: 1000) */
  pageDelay?: number;
}

/**
 * Result of pagination handling
 */
export interface PaginationResult {
  /** Number of pages visited */
  pagesVisited: number;
  /** Whether there are more pages available */
  hasMorePages: boolean;
}

/**
 * Options for waiting for AJAX content
 */
export interface WaitOptions {
  /** Maximum time to wait in ms (default: 10000) */
  timeout?: number;
  /** Time with no network activity to consider idle in ms (default: 500) */
  idleTime?: number;
}

/**
 * Result of waiting for AJAX content
 */
export interface WaitResult {
  /** Whether the wait completed successfully */
  waited: boolean;
  /** Whether the timeout was reached */
  timedOut: boolean;
  /** Duration waited in ms */
  duration: number;
}

// =============================================================================
// Default Selectors
// =============================================================================

/**
 * Common selectors for load more buttons
 */
export const DEFAULT_LOAD_MORE_SELECTORS = [
  'button:has-text("Load More")',
  'button:has-text("Show More")',
  'button:has-text("View More")',
  'button:has-text("See More")',
  'button:has-text("Load more")',
  'button:has-text("Show more")',
  '[data-testid="load-more"]',
  '.load-more',
  '.show-more',
  '.view-more',
  '[aria-label="Load more"]',
  '[aria-label="Show more"]',
];

/**
 * Common selectors for accordion triggers
 */
export const DEFAULT_ACCORDION_SELECTORS = [
  '[data-accordion-trigger]',
  '[data-accordion-header]',
  '.accordion-trigger',
  '.accordion-header',
  '.accordion-button',
  '[role="button"][aria-expanded="false"]',
  'button[aria-expanded="false"]',
  '.collapsible-trigger',
  '.collapse-trigger',
  'details:not([open]) > summary',
];

/**
 * Common selectors for tab triggers
 */
export const DEFAULT_TAB_SELECTORS = [
  '[role="tab"]:not([aria-selected="true"])',
  '.tab:not(.active)',
  '.nav-tab:not(.active)',
  '[data-tab]:not(.active)',
  '.tab-button:not(.selected)',
];

/**
 * Common selectors for pagination next buttons
 */
export const DEFAULT_PAGINATION_SELECTORS = [
  '[aria-label="Next"]',
  '[aria-label="Next page"]',
  'a:has-text("Next")',
  'button:has-text("Next")',
  '.pagination-next',
  '.next-page',
  '.pagination a:last-child',
  '[rel="next"]',
];

// =============================================================================
// Default Options
// =============================================================================

export const DEFAULT_SCROLL_OPTIONS: Required<ScrollOptions> = {
  maxScrolls: 50,
  scrollDistance: 500,
  scrollDelay: 300,
  contentSelector: '',
};

export const DEFAULT_LOAD_MORE_OPTIONS: Required<LoadMoreOptions> = {
  buttonSelectors: DEFAULT_LOAD_MORE_SELECTORS,
  maxClicks: 100,
  clickDelay: 500,
};

export const DEFAULT_EXPAND_OPTIONS: Required<ExpandOptions> = {
  accordionSelectors: DEFAULT_ACCORDION_SELECTORS,
  tabSelectors: DEFAULT_TAB_SELECTORS,
  expandDelay: 200,
};

export const DEFAULT_PAGINATION_OPTIONS: Required<PaginationOptions> = {
  nextButtonSelector: '',
  pageNumberSelector: '',
  maxPages: 100,
  pageDelay: 1000,
};

export const DEFAULT_WAIT_OPTIONS: Required<WaitOptions> = {
  timeout: 10000,
  idleTime: 500,
};


// =============================================================================
// JavaScript Code Generators for Playwright browser_evaluate
// =============================================================================

/**
 * Generate JavaScript code for infinite scroll handling.
 * This code is designed to be executed via Playwright's browser_evaluate.
 * 
 * @param options - Scroll options
 * @returns JavaScript function string for browser_evaluate
 * 
 * @requirements 19.1, 2.10
 */
export function generateInfiniteScrollCode(options: ScrollOptions = {}): string {
  const opts = { ...DEFAULT_SCROLL_OPTIONS, ...options };
  
  return `async () => {
    const maxScrolls = ${opts.maxScrolls};
    const scrollDistance = ${opts.scrollDistance};
    const scrollDelay = ${opts.scrollDelay};
    const contentSelector = '${opts.contentSelector}';
    
    let scrollCount = 0;
    const initialHeight = document.body.scrollHeight;
    let previousHeight = initialHeight;
    let noChangeCount = 0;
    const maxNoChange = 3;
    
    const getContentCount = () => {
      if (contentSelector) {
        return document.querySelectorAll(contentSelector).length;
      }
      return document.body.scrollHeight;
    };
    
    let previousContentCount = getContentCount();
    
    while (scrollCount < maxScrolls && noChangeCount < maxNoChange) {
      window.scrollBy(0, scrollDistance);
      scrollCount++;
      
      await new Promise(resolve => setTimeout(resolve, scrollDelay));
      
      const currentHeight = document.body.scrollHeight;
      const currentContentCount = getContentCount();
      
      if (currentHeight === previousHeight && currentContentCount === previousContentCount) {
        noChangeCount++;
      } else {
        noChangeCount = 0;
      }
      
      previousHeight = currentHeight;
      previousContentCount = currentContentCount;
      
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 10) {
        await new Promise(resolve => setTimeout(resolve, scrollDelay * 2));
        if (document.body.scrollHeight === currentHeight) {
          break;
        }
      }
    }
    
    return {
      scrollCount,
      newContentLoaded: document.body.scrollHeight > initialHeight,
      initialHeight,
      finalHeight: document.body.scrollHeight
    };
  }`;
}

/**
 * Generate JavaScript code for clicking load more buttons.
 * This code is designed to be executed via Playwright's browser_evaluate.
 * 
 * @param options - Load more options
 * @returns JavaScript function string for browser_evaluate
 * 
 * @requirements 19.2
 */
export function generateLoadMoreCode(options: LoadMoreOptions = {}): string {
  const opts = { ...DEFAULT_LOAD_MORE_OPTIONS, ...options };
  const selectorsJson = JSON.stringify(opts.buttonSelectors);
  
  return `async () => {
    const selectors = ${selectorsJson};
    const maxClicks = ${opts.maxClicks};
    const clickDelay = ${opts.clickDelay};
    
    let clickCount = 0;
    let buttonFound = false;
    
    const findButton = () => {
      for (const selector of selectors) {
        try {
          if (selector.includes(':has-text(')) {
            const match = selector.match(/:has-text\\("([^"]+)"\\)/);
            if (match) {
              const tag = selector.split(':')[0] || '*';
              const text = match[1];
              const elements = document.querySelectorAll(tag);
              for (const el of elements) {
                if (el.textContent && el.textContent.trim().toLowerCase().includes(text.toLowerCase())) {
                  const style = window.getComputedStyle(el);
                  if (style.display !== 'none' && style.visibility !== 'hidden') {
                    return el;
                  }
                }
              }
            }
          } else {
            const el = document.querySelector(selector);
            if (el) {
              const style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                return el;
              }
            }
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    };
    
    let button = findButton();
    buttonFound = button !== null;
    
    while (button && clickCount < maxClicks) {
      button.click();
      clickCount++;
      
      await new Promise(resolve => setTimeout(resolve, clickDelay));
      
      button = findButton();
    }
    
    return {
      clickCount,
      allContentLoaded: button === null,
      buttonFound
    };
  }`;
}


/**
 * Generate JavaScript code for expanding all accordions and tabs.
 * This code is designed to be executed via Playwright's browser_evaluate.
 * 
 * @param options - Expand options
 * @returns JavaScript function string for browser_evaluate
 * 
 * @requirements 19.5
 */
export function generateExpandSectionsCode(options: ExpandOptions = {}): string {
  const opts = { ...DEFAULT_EXPAND_OPTIONS, ...options };
  const accordionSelectorsJson = JSON.stringify(opts.accordionSelectors);
  const tabSelectorsJson = JSON.stringify(opts.tabSelectors);
  
  return `async () => {
    const accordionSelectors = ${accordionSelectorsJson};
    const tabSelectors = ${tabSelectorsJson};
    const expandDelay = ${opts.expandDelay};
    
    let accordionsExpanded = 0;
    let tabsExpanded = 0;
    
    // Expand accordions
    for (const selector of accordionSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            el.click();
            accordionsExpanded++;
            await new Promise(resolve => setTimeout(resolve, expandDelay));
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    // Open all details elements
    const detailsElements = document.querySelectorAll('details:not([open])');
    for (const details of detailsElements) {
      details.setAttribute('open', '');
      accordionsExpanded++;
      await new Promise(resolve => setTimeout(resolve, expandDelay));
    }
    
    // Click tabs to reveal content
    for (const selector of tabSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            el.click();
            tabsExpanded++;
            await new Promise(resolve => setTimeout(resolve, expandDelay));
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    return {
      expandedCount: accordionsExpanded + tabsExpanded,
      accordionsExpanded,
      tabsExpanded
    };
  }`;
}


/**
 * Generate JavaScript code for handling pagination.
 * Returns info about current page state; actual navigation should use Playwright click.
 * 
 * @param options - Pagination options
 * @returns JavaScript function string for browser_evaluate
 * 
 * @requirements 19.6
 */
export function generatePaginationInfoCode(options: PaginationOptions = {}): string {
  const opts = { ...DEFAULT_PAGINATION_OPTIONS, ...options };
  const defaultSelectors = JSON.stringify(DEFAULT_PAGINATION_SELECTORS);
  
  return `() => {
    const nextSelectors = ${opts.nextButtonSelector ? JSON.stringify([opts.nextButtonSelector]) : defaultSelectors};
    const pageSelector = '${opts.pageNumberSelector}';
    
    let nextButton = null;
    let nextButtonRef = null;
    
    for (const selector of nextSelectors) {
      try {
        if (selector.includes(':has-text(')) {
          const match = selector.match(/:has-text\\("([^"]+)"\\)/);
          if (match) {
            const tag = selector.split(':')[0] || '*';
            const text = match[1];
            const elements = document.querySelectorAll(tag);
            for (const el of elements) {
              if (el.textContent && el.textContent.trim().toLowerCase().includes(text.toLowerCase())) {
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled) {
                  nextButton = el;
                  nextButtonRef = selector;
                  break;
                }
              }
            }
          }
        } else {
          const el = document.querySelector(selector);
          if (el) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled) {
              nextButton = el;
              nextButtonRef = selector;
              break;
            }
          }
        }
      } catch (e) {
        continue;
      }
      if (nextButton) break;
    }
    
    let currentPage = 1;
    let totalPages = null;
    
    if (pageSelector) {
      const pageEl = document.querySelector(pageSelector);
      if (pageEl) {
        const text = pageEl.textContent || '';
        const match = text.match(/(\\d+)\\s*(?:of|\\/)\\s*(\\d+)/i);
        if (match) {
          currentPage = parseInt(match[1], 10);
          totalPages = parseInt(match[2], 10);
        }
      }
    }
    
    return {
      hasNextButton: nextButton !== null,
      nextButtonSelector: nextButtonRef,
      currentPage,
      totalPages,
      isLastPage: totalPages !== null ? currentPage >= totalPages : nextButton === null
    };
  }`;
}


/**
 * Generate JavaScript code for waiting for AJAX content to load.
 * Uses MutationObserver to detect when DOM changes stop.
 * 
 * @param options - Wait options
 * @returns JavaScript function string for browser_evaluate
 * 
 * @requirements 19.3
 */
export function generateWaitForAjaxCode(options: WaitOptions = {}): string {
  const opts = { ...DEFAULT_WAIT_OPTIONS, ...options };
  
  return `() => {
    return new Promise((resolve) => {
      const timeout = ${opts.timeout};
      const idleTime = ${opts.idleTime};
      const startTime = Date.now();
      
      let lastMutationTime = Date.now();
      let resolved = false;
      
      const observer = new MutationObserver(() => {
        lastMutationTime = Date.now();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
      
      const checkIdle = () => {
        if (resolved) return;
        
        const now = Date.now();
        const elapsed = now - startTime;
        const timeSinceLastMutation = now - lastMutationTime;
        
        if (elapsed >= timeout) {
          resolved = true;
          observer.disconnect();
          resolve({
            waited: true,
            timedOut: true,
            duration: elapsed
          });
          return;
        }
        
        if (timeSinceLastMutation >= idleTime) {
          resolved = true;
          observer.disconnect();
          resolve({
            waited: true,
            timedOut: false,
            duration: elapsed
          });
          return;
        }
        
        setTimeout(checkIdle, 100);
      };
      
      setTimeout(checkIdle, idleTime);
    });
  }`;
}

/**
 * Generate JavaScript code for scrolling lazy-loaded images into view.
 * 
 * @returns JavaScript function string for browser_evaluate
 * 
 * @requirements 19.4
 */
export function generateLoadLazyImagesCode(): string {
  return `async () => {
    const images = document.querySelectorAll('img[loading="lazy"], img[data-src], img[data-lazy]');
    let loadedCount = 0;
    
    for (const img of images) {
      img.scrollIntoView({ behavior: 'instant', block: 'center' });
      loadedCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Scroll back to top
    window.scrollTo(0, 0);
    
    return {
      imagesFound: images.length,
      imagesScrolled: loadedCount
    };
  }`;
}


// =============================================================================
// High-Level Handler Functions
// =============================================================================

/**
 * Handle infinite scroll by generating the appropriate browser code.
 * Returns the JavaScript code to execute via Playwright browser_evaluate.
 * 
 * @param options - Scroll options
 * @returns Object with the code to execute and expected result type
 * 
 * @requirements 19.1, 2.10
 */
export function handleInfiniteScroll(options: ScrollOptions = {}): {
  code: string;
  parseResult: (result: unknown) => ScrollResult;
} {
  return {
    code: generateInfiniteScrollCode(options),
    parseResult: (result: unknown): ScrollResult => {
      const r = result as Record<string, unknown>;
      return {
        scrollCount: typeof r.scrollCount === 'number' ? r.scrollCount : 0,
        newContentLoaded: Boolean(r.newContentLoaded),
        initialHeight: typeof r.initialHeight === 'number' ? r.initialHeight : 0,
        finalHeight: typeof r.finalHeight === 'number' ? r.finalHeight : 0,
      };
    },
  };
}

/**
 * Handle load more buttons by generating the appropriate browser code.
 * Returns the JavaScript code to execute via Playwright browser_evaluate.
 * 
 * @param options - Load more options
 * @returns Object with the code to execute and expected result type
 * 
 * @requirements 19.2
 */
export function handleLoadMoreButtons(options: LoadMoreOptions = {}): {
  code: string;
  parseResult: (result: unknown) => LoadMoreResult;
} {
  return {
    code: generateLoadMoreCode(options),
    parseResult: (result: unknown): LoadMoreResult => {
      const r = result as Record<string, unknown>;
      return {
        clickCount: typeof r.clickCount === 'number' ? r.clickCount : 0,
        allContentLoaded: Boolean(r.allContentLoaded),
        buttonFound: Boolean(r.buttonFound),
      };
    },
  };
}

/**
 * Expand all collapsible sections (accordions, tabs, details).
 * Returns the JavaScript code to execute via Playwright browser_evaluate.
 * 
 * @param options - Expand options
 * @returns Object with the code to execute and expected result type
 * 
 * @requirements 19.5
 */
export function expandAllSections(options: ExpandOptions = {}): {
  code: string;
  parseResult: (result: unknown) => ExpandResult;
} {
  return {
    code: generateExpandSectionsCode(options),
    parseResult: (result: unknown): ExpandResult => {
      const r = result as Record<string, unknown>;
      return {
        expandedCount: typeof r.expandedCount === 'number' ? r.expandedCount : 0,
        accordionsExpanded: typeof r.accordionsExpanded === 'number' ? r.accordionsExpanded : 0,
        tabsExpanded: typeof r.tabsExpanded === 'number' ? r.tabsExpanded : 0,
      };
    },
  };
}


/**
 * Get pagination information from the current page.
 * Returns the JavaScript code to execute via Playwright browser_evaluate.
 * 
 * @param options - Pagination options
 * @returns Object with the code to execute and result parser
 * 
 * @requirements 19.6
 */
export function handlePagination(options: PaginationOptions = {}): {
  code: string;
  parseResult: (result: unknown) => {
    hasNextButton: boolean;
    nextButtonSelector: string | null;
    currentPage: number;
    totalPages: number | null;
    isLastPage: boolean;
  };
} {
  return {
    code: generatePaginationInfoCode(options),
    parseResult: (result: unknown) => {
      const r = result as Record<string, unknown>;
      return {
        hasNextButton: Boolean(r.hasNextButton),
        nextButtonSelector: typeof r.nextButtonSelector === 'string' ? r.nextButtonSelector : null,
        currentPage: typeof r.currentPage === 'number' ? r.currentPage : 1,
        totalPages: typeof r.totalPages === 'number' ? r.totalPages : null,
        isLastPage: Boolean(r.isLastPage),
      };
    },
  };
}

/**
 * Wait for AJAX content to finish loading.
 * Returns the JavaScript code to execute via Playwright browser_evaluate.
 * 
 * @param options - Wait options
 * @returns Object with the code to execute and result parser
 * 
 * @requirements 19.3
 */
export function waitForAjaxContent(options: WaitOptions = {}): {
  code: string;
  parseResult: (result: unknown) => WaitResult;
} {
  return {
    code: generateWaitForAjaxCode(options),
    parseResult: (result: unknown): WaitResult => {
      const r = result as Record<string, unknown>;
      return {
        waited: Boolean(r.waited),
        timedOut: Boolean(r.timedOut),
        duration: typeof r.duration === 'number' ? r.duration : 0,
      };
    },
  };
}

/**
 * Load all lazy-loaded images by scrolling them into view.
 * Returns the JavaScript code to execute via Playwright browser_evaluate.
 * 
 * @returns Object with the code to execute and result parser
 * 
 * @requirements 19.4
 */
export function loadLazyImages(): {
  code: string;
  parseResult: (result: unknown) => { imagesFound: number; imagesScrolled: number };
} {
  return {
    code: generateLoadLazyImagesCode(),
    parseResult: (result: unknown) => {
      const r = result as Record<string, unknown>;
      return {
        imagesFound: typeof r.imagesFound === 'number' ? r.imagesFound : 0,
        imagesScrolled: typeof r.imagesScrolled === 'number' ? r.imagesScrolled : 0,
      };
    },
  };
}


// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Merge custom selectors with defaults, removing duplicates.
 * 
 * @param custom - Custom selectors to add
 * @param defaults - Default selectors
 * @returns Combined array of unique selectors
 */
export function mergeSelectors(custom: string[], defaults: string[]): string[] {
  return [...new Set([...custom, ...defaults])];
}

/**
 * Create a complete dynamic content loading sequence.
 * Returns an array of operations to execute in order.
 * 
 * @param options - Options for each operation
 * @returns Array of operations with their codes and parsers
 */
export function createLoadingSequence(options: {
  scroll?: ScrollOptions;
  loadMore?: LoadMoreOptions;
  expand?: ExpandOptions;
  waitForAjax?: WaitOptions;
  loadImages?: boolean;
} = {}): Array<{
  name: string;
  handler: { code: string; parseResult: (result: unknown) => unknown };
}> {
  const sequence: Array<{
    name: string;
    handler: { code: string; parseResult: (result: unknown) => unknown };
  }> = [];

  // 1. Wait for initial AJAX content
  if (options.waitForAjax !== undefined || Object.keys(options).length === 0) {
    sequence.push({
      name: 'waitForAjax',
      handler: waitForAjaxContent(options.waitForAjax),
    });
  }

  // 2. Expand all sections first (to reveal hidden content)
  if (options.expand !== undefined || Object.keys(options).length === 0) {
    sequence.push({
      name: 'expandSections',
      handler: expandAllSections(options.expand),
    });
  }

  // 3. Handle infinite scroll
  if (options.scroll !== undefined || Object.keys(options).length === 0) {
    sequence.push({
      name: 'infiniteScroll',
      handler: handleInfiniteScroll(options.scroll),
    });
  }

  // 4. Click load more buttons
  if (options.loadMore !== undefined || Object.keys(options).length === 0) {
    sequence.push({
      name: 'loadMore',
      handler: handleLoadMoreButtons(options.loadMore),
    });
  }

  // 5. Load lazy images
  if (options.loadImages !== false) {
    sequence.push({
      name: 'loadLazyImages',
      handler: loadLazyImages(),
    });
  }

  // 6. Final wait for any triggered AJAX
  sequence.push({
    name: 'finalWait',
    handler: waitForAjaxContent({ timeout: 3000, idleTime: 500 }),
  });

  return sequence;
}
