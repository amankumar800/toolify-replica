/**
 * Property-Based Tests for MobileDrawer Component
 * 
 * **Feature: free-ai-tools, Property 11: Mobile Drawer Body Scroll Prevention**
 * **Validates: Requirements 19.5**
 * 
 * Tests that for any state where the mobile drawer is open, the body element
 * SHALL have scroll disabled (overflow: hidden) to prevent background scrolling.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getBodyOverflowStyle } from './MobileDrawer';

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('MobileDrawer - Body Scroll Prevention', () => {
  /**
   * **Feature: free-ai-tools, Property 11: Mobile Drawer Body Scroll Prevention**
   * **Validates: Requirements 19.5**
   * 
   * For any state where the mobile drawer is open, the body element SHALL have
   * scroll disabled (overflow: hidden) to prevent background scrolling.
   */

  describe('Property 11: Mobile Drawer Body Scroll Prevention', () => {
    it('returns "hidden" when drawer is open (isOpen = true)', () => {
      fc.assert(
        fc.property(fc.constant(true), (isOpen) => {
          const result = getBodyOverflowStyle(isOpen);
          
          // When drawer is open, overflow should be 'hidden'
          expect(result).toBe('hidden');
        }),
        { numRuns: 100 }
      );
    });

    it('returns empty string when drawer is closed (isOpen = false)', () => {
      fc.assert(
        fc.property(fc.constant(false), (isOpen) => {
          const result = getBodyOverflowStyle(isOpen);
          
          // When drawer is closed, overflow should be empty (allowing scroll)
          expect(result).toBe('');
        }),
        { numRuns: 100 }
      );
    });

    it('correctly maps any boolean state to appropriate overflow style', () => {
      fc.assert(
        fc.property(fc.boolean(), (isOpen) => {
          const result = getBodyOverflowStyle(isOpen);
          
          // Invariant: isOpen === true implies overflow === 'hidden'
          // Invariant: isOpen === false implies overflow === ''
          if (isOpen) {
            expect(result).toBe('hidden');
          } else {
            expect(result).toBe('');
          }
          
          // Result should always be one of these two values
          expect(['hidden', '']).toContain(result);
        }),
        { numRuns: 100 }
      );
    });

    it('is idempotent - calling multiple times with same input returns same result', () => {
      fc.assert(
        fc.property(fc.boolean(), (isOpen) => {
          const result1 = getBodyOverflowStyle(isOpen);
          const result2 = getBodyOverflowStyle(isOpen);
          const result3 = getBodyOverflowStyle(isOpen);
          
          // Function should be pure and idempotent
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }),
        { numRuns: 100 }
      );
    });

    it('open state always prevents scrolling', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 100 }), // Generate multiple "open" events
          (count) => {
            // Simulate multiple drawer open states
            for (let i = 0; i < count; i++) {
              const result = getBodyOverflowStyle(true);
              expect(result).toBe('hidden');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('closed state always allows scrolling', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 100 }), // Generate multiple "close" events
          (count) => {
            // Simulate multiple drawer close states
            for (let i = 0; i < count; i++) {
              const result = getBodyOverflowStyle(false);
              expect(result).toBe('');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('state transitions maintain correct overflow behavior', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 50 }), // Sequence of state changes
          (stateSequence) => {
            // Simulate a sequence of drawer open/close state changes
            for (const isOpen of stateSequence) {
              const result = getBodyOverflowStyle(isOpen);
              
              // Each state should produce the correct overflow value
              const expectedOverflow = isOpen ? 'hidden' : '';
              expect(result).toBe(expectedOverflow);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
