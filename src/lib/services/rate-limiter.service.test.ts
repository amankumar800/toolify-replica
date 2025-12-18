/**
 * Property-Based Tests for Rate Limiter Service
 * 
 * Tests that:
 * - Property 6: Rate Limiting Compliance - minimum 2-second delay between requests
 * - Property 7: Exponential Backoff on 429 - correct backoff calculation
 * 
 * @see .kiro/specs/page-cloning-agent/design.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  RateLimiter,
  exponentialBackoff,
  MIN_REQUEST_DELAY_MS,
  INITIAL_BACKOFF_MS,
  MAX_BACKOFF_MS,
} from './rate-limiter.service';

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('Rate Limiter Service - Property 6: Rate Limiting Compliance', () => {
  /**
   * **Feature: page-cloning-agent, Property 6: Rate Limiting Compliance**
   * **Validates: Requirements 18.1**
   * 
   * For any sequence of page navigations during scraping, the time between
   * consecutive navigations SHALL be at least 2000 milliseconds.
   */

  it('calculateWaitTime returns at least MIN_REQUEST_DELAY_MS minus elapsed time', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }), // elapsed time in ms
        (elapsedMs) => {
          const limiter = new RateLimiter();
          const now = Date.now();
          
          // Simulate a previous request
          (limiter as unknown as { lastRequestTime: number }).lastRequestTime = now - elapsedMs;
          
          const waitTime = limiter.calculateWaitTime(now);
          
          // Wait time should ensure total delay is at least MIN_REQUEST_DELAY_MS
          if (elapsedMs >= MIN_REQUEST_DELAY_MS) {
            expect(waitTime).toBe(0);
          } else {
            expect(waitTime).toBe(MIN_REQUEST_DELAY_MS - elapsedMs);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('calculateWaitTime ensures minimum delay is always satisfied', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 5000 }), // elapsed time in ms (less than or around MIN_REQUEST_DELAY_MS)
        (elapsedMs) => {
          const limiter = new RateLimiter();
          const now = Date.now();
          
          // Simulate a previous request
          (limiter as unknown as { lastRequestTime: number }).lastRequestTime = now - elapsedMs;
          
          const waitTime = limiter.calculateWaitTime(now);
          
          // The total time (elapsed + wait) should be at least MIN_REQUEST_DELAY_MS
          expect(elapsedMs + waitTime).toBeGreaterThanOrEqual(MIN_REQUEST_DELAY_MS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('first request has zero wait time', () => {
    const limiter = new RateLimiter();
    expect(limiter.calculateWaitTime()).toBe(0);
  });

  it('custom minimum delay is respected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }), // custom delay
        fc.nat({ max: 10000 }), // elapsed time
        (customDelay, elapsedMs) => {
          const limiter = new RateLimiter(customDelay);
          const now = Date.now();
          
          // Simulate a previous request
          (limiter as unknown as { lastRequestTime: number }).lastRequestTime = now - elapsedMs;
          
          const waitTime = limiter.calculateWaitTime(now);
          
          // Total time should be at least the custom delay
          expect(elapsedMs + waitTime).toBeGreaterThanOrEqual(customDelay);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Rate Limiter Service - Property 7: Exponential Backoff on 429', () => {
  /**
   * **Feature: page-cloning-agent, Property 7: Exponential Backoff on 429**
   * **Validates: Requirements 18.3**
   * 
   * For any HTTP 429 response, the retry delay SHALL follow exponential backoff
   * starting at 5 seconds, doubling each retry, with maximum 60 seconds.
   */

  it('exponentialBackoff follows formula: min(5000 * 2^attempt, 60000)', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 20 }), // attempt number
        (attempt) => {
          const delay = exponentialBackoff(attempt);
          const expected = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
          expect(delay).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('exponentialBackoff starts at INITIAL_BACKOFF_MS (5000ms) for attempt 0', () => {
    expect(exponentialBackoff(0)).toBe(INITIAL_BACKOFF_MS);
    expect(exponentialBackoff(0)).toBe(5000);
  });

  it('exponentialBackoff doubles with each attempt', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10 }), // attempt number (limited to avoid hitting max)
        (attempt) => {
          const currentDelay = exponentialBackoff(attempt);
          const nextDelay = exponentialBackoff(attempt + 1);
          
          // If current delay is less than max, next should be double (or max)
          if (currentDelay < MAX_BACKOFF_MS) {
            expect(nextDelay).toBe(Math.min(currentDelay * 2, MAX_BACKOFF_MS));
          } else {
            expect(nextDelay).toBe(MAX_BACKOFF_MS);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('exponentialBackoff never exceeds MAX_BACKOFF_MS (60000ms)', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100 }), // any attempt number
        (attempt) => {
          const delay = exponentialBackoff(attempt);
          expect(delay).toBeLessThanOrEqual(MAX_BACKOFF_MS);
          expect(delay).toBeLessThanOrEqual(60000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('exponentialBackoff is always at least INITIAL_BACKOFF_MS', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100 }), // any attempt number
        (attempt) => {
          const delay = exponentialBackoff(attempt);
          expect(delay).toBeGreaterThanOrEqual(INITIAL_BACKOFF_MS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('exponentialBackoff handles negative attempts gracefully', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: -1 }), // negative attempt numbers
        (attempt) => {
          const delay = exponentialBackoff(attempt);
          // Should return initial backoff for negative attempts
          expect(delay).toBe(INITIAL_BACKOFF_MS);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('exponentialBackoff reaches MAX_BACKOFF_MS at correct attempt', () => {
    // 5000 * 2^0 = 5000
    // 5000 * 2^1 = 10000
    // 5000 * 2^2 = 20000
    // 5000 * 2^3 = 40000
    // 5000 * 2^4 = 80000 -> capped at 60000
    expect(exponentialBackoff(0)).toBe(5000);
    expect(exponentialBackoff(1)).toBe(10000);
    expect(exponentialBackoff(2)).toBe(20000);
    expect(exponentialBackoff(3)).toBe(40000);
    expect(exponentialBackoff(4)).toBe(60000); // Capped
    expect(exponentialBackoff(5)).toBe(60000); // Stays at max
    expect(exponentialBackoff(10)).toBe(60000); // Stays at max
  });
});

// =============================================================================
// Unit Tests for RateLimiter Class
// =============================================================================

describe('RateLimiter Class', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('should initialize with lastRequestTime of 0', () => {
    expect(limiter.getLastRequestTime()).toBe(0);
  });

  it('should reset lastRequestTime to 0', () => {
    // Simulate a request
    (limiter as unknown as { lastRequestTime: number }).lastRequestTime = Date.now();
    expect(limiter.getLastRequestTime()).toBeGreaterThan(0);
    
    limiter.reset();
    expect(limiter.getLastRequestTime()).toBe(0);
  });

  it('should use default MIN_REQUEST_DELAY_MS', () => {
    const defaultLimiter = new RateLimiter();
    const now = Date.now();
    (defaultLimiter as unknown as { lastRequestTime: number }).lastRequestTime = now;
    
    const waitTime = defaultLimiter.calculateWaitTime(now);
    expect(waitTime).toBe(MIN_REQUEST_DELAY_MS);
  });

  it('should accept custom minimum delay', () => {
    const customDelay = 5000;
    const customLimiter = new RateLimiter(customDelay);
    const now = Date.now();
    (customLimiter as unknown as { lastRequestTime: number }).lastRequestTime = now;
    
    const waitTime = customLimiter.calculateWaitTime(now);
    expect(waitTime).toBe(customDelay);
  });
});
