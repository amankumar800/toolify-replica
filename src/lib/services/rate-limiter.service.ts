/**
 * Rate Limiter Service for Page Cloning Agent
 * 
 * Implements rate limiting and exponential backoff for web scraping operations.
 * Ensures compliance with rate limits and handles 429 (Too Many Requests) responses.
 * 
 * @module rate-limiter.service
 * @see Requirements 18.1, 18.3, 18.4, 18.5
 */

/** Minimum delay between consecutive requests in milliseconds (2 seconds) */
export const MIN_REQUEST_DELAY_MS = 2000;

/** Initial backoff delay for 429 responses in milliseconds (5 seconds) */
export const INITIAL_BACKOFF_MS = 5000;

/** Maximum backoff delay in milliseconds (60 seconds) */
export const MAX_BACKOFF_MS = 60000;

/**
 * Calculates exponential backoff delay for a given attempt number.
 * 
 * Formula: min(INITIAL_BACKOFF_MS * 2^attempt, MAX_BACKOFF_MS)
 * 
 * @param attempt - The retry attempt number (0-indexed)
 * @returns The delay in milliseconds to wait before retrying
 * 
 * @example
 * exponentialBackoff(0) // Returns 5000 (5s)
 * exponentialBackoff(1) // Returns 10000 (10s)
 * exponentialBackoff(2) // Returns 20000 (20s)
 * exponentialBackoff(3) // Returns 40000 (40s)
 * exponentialBackoff(4) // Returns 60000 (60s) - capped at max
 */
export function exponentialBackoff(attempt: number): number {
  if (attempt < 0) {
    return INITIAL_BACKOFF_MS;
  }
  return Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
}

/**
 * Sleep utility function that returns a promise resolving after the specified delay.
 * 
 * @param ms - Duration to sleep in milliseconds
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate Limiter class for managing request timing and backoff.
 * 
 * Maintains state to track the last request time and enforce minimum delays
 * between consecutive requests.
 */
export class RateLimiter {
  private lastRequestTime: number = 0;

  /**
   * Creates a new RateLimiter instance.
   * 
   * @param minDelayMs - Minimum delay between requests in milliseconds (default: 2000)
   */
  constructor(private minDelayMs: number = MIN_REQUEST_DELAY_MS) {}

  /**
   * Gets the timestamp of the last request.
   * 
   * @returns The timestamp in milliseconds, or 0 if no requests have been made
   */
  getLastRequestTime(): number {
    return this.lastRequestTime;
  }

  /**
   * Calculates the required wait time to satisfy the minimum delay requirement.
   * 
   * @param currentTime - The current timestamp in milliseconds (default: Date.now())
   * @returns The time in milliseconds to wait before the next request
   */
  calculateWaitTime(currentTime: number = Date.now()): number {
    if (this.lastRequestTime === 0) {
      return 0;
    }
    const elapsed = currentTime - this.lastRequestTime;
    return Math.max(0, this.minDelayMs - elapsed);
  }

  /**
   * Waits the required time to satisfy the minimum delay between requests.
   * Updates the last request time after waiting.
   * 
   * @returns The actual time waited in milliseconds
   * 
   * @example
   * const limiter = new RateLimiter();
   * await limiter.waitBetweenRequests(); // First call, no wait
   * await limiter.waitBetweenRequests(); // Waits up to 2 seconds
   */
  async waitBetweenRequests(): Promise<number> {
    const waitTime = this.calculateWaitTime();
    
    if (waitTime > 0) {
      await sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
    return waitTime;
  }

  /**
   * Handles a rate limit (HTTP 429) response by waiting with exponential backoff.
   * 
   * @param attempt - The retry attempt number (0-indexed)
   * @returns The delay that was waited in milliseconds
   * 
   * @example
   * const limiter = new RateLimiter();
   * // After receiving 429 response
   * await limiter.handleRateLimit(0); // Waits 5 seconds
   * await limiter.handleRateLimit(1); // Waits 10 seconds
   */
  async handleRateLimit(attempt: number): Promise<number> {
    const delay = exponentialBackoff(attempt);
    await sleep(delay);
    this.lastRequestTime = Date.now();
    return delay;
  }

  /**
   * Resets the rate limiter state, clearing the last request time.
   * Useful for starting a new scraping session.
   */
  reset(): void {
    this.lastRequestTime = 0;
  }
}

/**
 * Default rate limiter instance for convenience.
 * Use this for simple cases where a single rate limiter is sufficient.
 */
export const defaultRateLimiter = new RateLimiter();

/**
 * Convenience function to wait between requests using the default rate limiter.
 * 
 * @returns The actual time waited in milliseconds
 */
export async function waitBetweenRequests(): Promise<number> {
  return defaultRateLimiter.waitBetweenRequests();
}

/**
 * Convenience function to handle rate limits using the default rate limiter.
 * 
 * @param attempt - The retry attempt number (0-indexed)
 * @returns The delay that was waited in milliseconds
 */
export async function handleRateLimit(attempt: number): Promise<number> {
  return defaultRateLimiter.handleRateLimit(attempt);
}
