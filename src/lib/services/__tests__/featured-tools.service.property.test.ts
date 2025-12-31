/**
 * Property-based tests for Featured Tools Service
 *
 * Tests Property 17 from the design document:
 * - Property 17: Featured Tool Status Calculation
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 10.3**
 *
 * Property 17: Featured Tool Status Calculation
 * *For any* featured tool, the status SHALL be calculated as:
 * - "scheduled" if start_date > today
 * - "expired" if end_date < today
 * - "active" otherwise
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateFeaturedToolStatus } from '@/lib/services/featured-tools.service';

// Helper to format date as ISO string (date only, no time)
function toDateString(date: Date): string {
  // Use local date parts to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

// Helper to get today's date string in YYYY-MM-DD format
function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get today's date at midnight
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Arbitrary for generating dates relative to today
const futureDateArbitrary = fc.integer({ min: 1, max: 365 }).map(daysFromNow => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return toDateString(date);
});

const pastDateArbitrary = fc.integer({ min: 1, max: 365 }).map(daysAgo => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return toDateString(date);
});

const todayDateArbitrary = fc.constant(() => {
  const today = new Date();
  return toDateString(today);
}).map(fn => fn());

// Arbitrary for generating date ranges
const validDateRangeArbitrary = fc.tuple(
  fc.integer({ min: -365, max: 365 }),
  fc.integer({ min: 0, max: 365 })
).map(([startOffset, duration]) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + startOffset);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration);
  return {
    start_date: toDateString(startDate),
    end_date: toDateString(endDate),
  };
});

describe('Featured Tools Service Property Tests', { timeout: 60000 }, () => {
  /**
   * **Feature: admin-panel-crud, Property 17: Featured Tool Status Calculation**
   * **Validates: Requirements 10.3**
   *
   * *For any* featured tool, the status SHALL be calculated as:
   * - "scheduled" if start_date > today
   * - "expired" if end_date < today
   * - "active" otherwise
   */
  describe('Property 17: Featured Tool Status Calculation', () => {
    it('should return "scheduled" when start_date is in the future', async () => {
      await fc.assert(
        fc.asyncProperty(
          futureDateArbitrary,
          fc.option(futureDateArbitrary, { nil: null }),
          async (startDate, endDate) => {
            const status = calculateFeaturedToolStatus(startDate, endDate);
            
            // Property: If start_date > today, status should be "scheduled"
            expect(status).toBe('scheduled');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "expired" when end_date is in the past', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(pastDateArbitrary, { nil: null }),
          pastDateArbitrary,
          async (startDate, endDate) => {
            // Ensure start_date is before or equal to end_date if both are provided
            let validStartDate = startDate;
            if (startDate && new Date(startDate) > new Date(endDate)) {
              validStartDate = endDate;
            }
            
            const status = calculateFeaturedToolStatus(validStartDate, endDate);
            
            // Property: If end_date < today, status should be "expired"
            expect(status).toBe('expired');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "active" when start_date is today or in the past and end_date is today or in the future', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(pastDateArbitrary, todayDateArbitrary),
          fc.oneof(futureDateArbitrary, todayDateArbitrary),
          async (startDate, endDate) => {
            const status = calculateFeaturedToolStatus(startDate, endDate);
            
            // Property: If start_date <= today AND end_date >= today, status should be "active"
            expect(status).toBe('active');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "active" when both dates are null', async () => {
      const status = calculateFeaturedToolStatus(null, null);
      
      // Property: If both dates are null, status should be "active" (no restrictions)
      expect(status).toBe('active');
    });

    it('should return "active" when only start_date is null and end_date is in the future', async () => {
      await fc.assert(
        fc.asyncProperty(
          futureDateArbitrary,
          async (endDate) => {
            const status = calculateFeaturedToolStatus(null, endDate);
            
            // Property: If start_date is null and end_date >= today, status should be "active"
            expect(status).toBe('active');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "expired" when only start_date is null and end_date is in the past', async () => {
      await fc.assert(
        fc.asyncProperty(
          pastDateArbitrary,
          async (endDate) => {
            const status = calculateFeaturedToolStatus(null, endDate);
            
            // Property: If start_date is null and end_date < today, status should be "expired"
            expect(status).toBe('expired');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "scheduled" when only end_date is null and start_date is in the future', async () => {
      await fc.assert(
        fc.asyncProperty(
          futureDateArbitrary,
          async (startDate) => {
            const status = calculateFeaturedToolStatus(startDate, null);
            
            // Property: If end_date is null and start_date > today, status should be "scheduled"
            expect(status).toBe('scheduled');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "active" when only end_date is null and start_date is today or in the past', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(pastDateArbitrary, todayDateArbitrary),
          async (startDate) => {
            const status = calculateFeaturedToolStatus(startDate, null);
            
            // Property: If end_date is null and start_date <= today, status should be "active"
            expect(status).toBe('active');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case: start_date equals today', async () => {
      const todayStr = getTodayString();
      const today = toDateString(new Date());
      const futureDate = toDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now
      
      const status = calculateFeaturedToolStatus(today, futureDate);
      
      // Property: If start_date equals today, status should be "active" (not scheduled)
      expect(status).toBe('active');
    });

    it('should handle edge case: end_date equals today', async () => {
      const today = toDateString(new Date());
      const pastDate = toDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // 7 days ago
      
      const status = calculateFeaturedToolStatus(pastDate, today);
      
      // Property: If end_date equals today, status should be "active" (not expired)
      expect(status).toBe('active');
    });

    it('should correctly calculate status for various date combinations', async () => {
      await fc.assert(
        fc.asyncProperty(
          validDateRangeArbitrary,
          async ({ start_date, end_date }) => {
            const status = calculateFeaturedToolStatus(start_date, end_date);
            const todayStr = getTodayString();
            const startStr = start_date.split('T')[0];
            const endStr = end_date.split('T')[0];
            
            // Verify the status calculation is correct using string comparison
            if (startStr > todayStr) {
              expect(status).toBe('scheduled');
            } else if (endStr < todayStr) {
              expect(status).toBe('expired');
            } else {
              expect(status).toBe('active');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic - same inputs always produce same output', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => toDateString(d)), { nil: null }),
          fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => toDateString(d)), { nil: null }),
          async (startDate, endDate) => {
            const status1 = calculateFeaturedToolStatus(startDate, endDate);
            const status2 = calculateFeaturedToolStatus(startDate, endDate);
            
            // Property: Same inputs should always produce the same output
            expect(status1).toBe(status2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return one of the three valid statuses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => toDateString(d)), { nil: null }),
          fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => toDateString(d)), { nil: null }),
          async (startDate, endDate) => {
            const status = calculateFeaturedToolStatus(startDate, endDate);
            
            // Property: Status should always be one of the three valid values
            expect(['active', 'scheduled', 'expired']).toContain(status);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
