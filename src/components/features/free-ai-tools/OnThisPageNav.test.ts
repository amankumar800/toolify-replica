/**
 * Property-Based Tests for OnThisPageNav Component
 * 
 * **Feature: free-ai-tools, Property 8: Scroll Spy Section Highlighting**
 * **Validates: Requirements 11.4**
 * 
 * Tests that for any scroll position on a category page, exactly one subcategory
 * in the On This Page Nav SHALL be highlighted.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  calculateActiveSectionFromPositions, 
  getSubcategorySectionId 
} from './OnThisPageNav';
import type { Subcategory } from '@/lib/types/free-ai-tools';

// =============================================================================
// Arbitraries (Generators) for Property-Based Testing
// =============================================================================

/**
 * Generates a valid section object with id and top position
 */
const sectionArbitrary = fc.record({
  id: fc.uuid(),
  top: fc.integer({ min: -10000, max: 10000 }), // Simulates various scroll positions
});

/**
 * Generates an array of sections with monotonically increasing top positions
 * This simulates the real DOM where sections appear in order from top to bottom
 */
const orderedSectionsArbitrary = fc
  .array(fc.uuid(), { minLength: 1, maxLength: 20 })
  .chain((ids) => {
    // Generate starting position and increments
    return fc
      .tuple(
        fc.integer({ min: -500, max: 500 }), // Starting top position
        fc.array(fc.integer({ min: 50, max: 500 }), { minLength: ids.length - 1, maxLength: ids.length - 1 })
      )
      .map(([startTop, increments]) => {
        let currentTop = startTop;
        return ids.map((id, index) => {
          const section = { id, top: currentTop };
          if (index < increments.length) {
            currentTop += increments[index];
          }
          return section;
        });
      });
  });

/**
 * Generates a valid threshold value (positive integer)
 */
const thresholdArbitrary = fc.integer({ min: 1, max: 500 });

/**
 * Generates a valid Subcategory object for testing getSubcategorySectionId
 */
const subcategoryArbitrary: fc.Arbitrary<Subcategory> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  toolCount: fc.nat({ max: 1000 }),
  tools: fc.constant([]), // Empty tools array for simplicity
});

// =============================================================================
// Property-Based Tests
// =============================================================================

describe('OnThisPageNav - Scroll Spy Section Highlighting', () => {
  /**
   * **Feature: free-ai-tools, Property 8: Scroll Spy Section Highlighting**
   * **Validates: Requirements 11.4**
   * 
   * For any scroll position on a category page, exactly one subcategory
   * in the On This Page Nav SHALL be highlighted, corresponding to the
   * currently visible section.
   */

  describe('Property 8: Scroll Spy Section Highlighting', () => {
    it('returns exactly one active section for any non-empty sections array', () => {
      fc.assert(
        fc.property(
          orderedSectionsArbitrary,
          thresholdArbitrary,
          (sections, threshold) => {
            const activeId = calculateActiveSectionFromPositions(sections, threshold);
            
            // Should return exactly one section ID
            expect(activeId).toBeTruthy();
            expect(typeof activeId).toBe('string');
            
            // The active ID should be one of the section IDs
            const sectionIds = sections.map(s => s.id);
            expect(sectionIds).toContain(activeId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns empty string for empty sections array', () => {
      fc.assert(
        fc.property(thresholdArbitrary, (threshold) => {
          const activeId = calculateActiveSectionFromPositions([], threshold);
          expect(activeId).toBe('');
        }),
        { numRuns: 100 }
      );
    });

    it('returns first section when all sections are below threshold', () => {
      fc.assert(
        fc.property(
          fc
            .array(fc.uuid(), { minLength: 1, maxLength: 10 })
            .chain((ids) => {
              // All sections have top > threshold
              return fc
                .array(fc.integer({ min: 101, max: 1000 }), { minLength: ids.length, maxLength: ids.length })
                .map((tops) => ids.map((id, i) => ({ id, top: tops[i] })));
            }),
          (sections) => {
            const threshold = 100;
            const activeId = calculateActiveSectionFromPositions(sections, threshold);
            
            // Should return the first section (default)
            expect(activeId).toBe(sections[0].id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns last section at or above threshold', () => {
      fc.assert(
        fc.property(orderedSectionsArbitrary, thresholdArbitrary, (sections, threshold) => {
          const activeId = calculateActiveSectionFromPositions(sections, threshold);
          
          // Find all sections at or above threshold
          const sectionsAtOrAboveThreshold = sections.filter(s => s.top <= threshold);
          
          if (sectionsAtOrAboveThreshold.length === 0) {
            // If no sections are at or above threshold, first section is active
            expect(activeId).toBe(sections[0].id);
          } else {
            // The active section should be the last one at or above threshold
            const expectedActive = sectionsAtOrAboveThreshold[sectionsAtOrAboveThreshold.length - 1];
            expect(activeId).toBe(expectedActive.id);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('active section changes correctly as scroll position changes', () => {
      // Create a fixed set of sections
      const sections = [
        { id: 'section-1', top: 0 },
        { id: 'section-2', top: 200 },
        { id: 'section-3', top: 400 },
        { id: 'section-4', top: 600 },
      ];
      const threshold = 100;

      // Simulate scrolling by adjusting all tops
      fc.assert(
        fc.property(fc.integer({ min: -100, max: 700 }), (scrollOffset) => {
          // Adjust section positions based on scroll
          const adjustedSections = sections.map(s => ({
            id: s.id,
            top: s.top - scrollOffset,
          }));

          const activeId = calculateActiveSectionFromPositions(adjustedSections, threshold);

          // Verify the active section is correct
          const sectionsAtOrAboveThreshold = adjustedSections.filter(s => s.top <= threshold);
          
          if (sectionsAtOrAboveThreshold.length === 0) {
            expect(activeId).toBe(adjustedSections[0].id);
          } else {
            const expectedActive = sectionsAtOrAboveThreshold[sectionsAtOrAboveThreshold.length - 1];
            expect(activeId).toBe(expectedActive.id);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('getSubcategorySectionId', () => {
    it('generates consistent IDs for the same subcategory', () => {
      fc.assert(
        fc.property(subcategoryArbitrary, (subcategory) => {
          const id1 = getSubcategorySectionId(subcategory);
          const id2 = getSubcategorySectionId(subcategory);
          
          expect(id1).toBe(id2);
        }),
        { numRuns: 100 }
      );
    });

    it('generates unique IDs for different subcategories', () => {
      fc.assert(
        fc.property(
          subcategoryArbitrary,
          subcategoryArbitrary.filter(s => s.id !== ''), // Ensure different IDs
          (sub1, sub2) => {
            // Only test if IDs are different
            if (sub1.id === sub2.id) return true;
            
            const id1 = getSubcategorySectionId(sub1);
            const id2 = getSubcategorySectionId(sub2);
            
            expect(id1).not.toBe(id2);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generates IDs in the expected format', () => {
      fc.assert(
        fc.property(subcategoryArbitrary, (subcategory) => {
          const id = getSubcategorySectionId(subcategory);
          
          // Should start with 'subcategory-'
          expect(id.startsWith('subcategory-')).toBe(true);
          
          // Should contain the subcategory ID
          expect(id).toBe(`subcategory-${subcategory.id}`);
        }),
        { numRuns: 100 }
      );
    });
  });
});
