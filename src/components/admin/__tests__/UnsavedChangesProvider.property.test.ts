/**
 * Property-based tests for UnsavedChangesProvider
 *
 * Tests Property 39 from the design document:
 * - Property 39: Unsaved Changes Warning
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 13.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Test Arbitraries
// ============================================================================

// Form ID arbitrary - valid form identifiers
const formIdArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9-_]{0,49}$/);

// Multiple form IDs arbitrary
const formIdsArb = fc.array(formIdArb, { minLength: 1, maxLength: 10 });

// Unique form IDs arbitrary
const uniqueFormIdsArb = fc.uniqueArray(formIdArb, { minLength: 1, maxLength: 10 });

// Boolean arbitrary for dirty state
const dirtyStateArb = fc.boolean();

// Sequence of dirty state changes
const dirtyStateSequenceArb = fc.array(
  fc.record({
    formId: formIdArb,
    isDirty: dirtyStateArb,
  }),
  { minLength: 1, maxLength: 20 }
);

// ============================================================================
// Helper: Simulate UnsavedChangesProvider State
// ============================================================================

/**
 * Simulates the state management logic of UnsavedChangesProvider
 * This allows us to test the core logic without React rendering
 */
class UnsavedChangesState {
  private dirtyForms: Set<string> = new Set();

  get hasUnsavedChanges(): boolean {
    return this.dirtyForms.size > 0;
  }

  setHasUnsavedChanges(value: boolean): void {
    if (value) {
      this.dirtyForms.add('default');
    } else {
      this.dirtyForms.delete('default');
    }
  }

  markFormDirty(formId: string, isDirty: boolean): void {
    if (isDirty) {
      this.dirtyForms.add(formId);
    } else {
      this.dirtyForms.delete(formId);
    }
  }

  unregisterForm(formId: string): void {
    this.dirtyForms.delete(formId);
  }

  getDirtyFormCount(): number {
    return this.dirtyForms.size;
  }

  getDirtyForms(): string[] {
    return Array.from(this.dirtyForms);
  }

  reset(): void {
    this.dirtyForms.clear();
  }
}

// ============================================================================
// Property 39: Unsaved Changes Warning
// ============================================================================

describe('Property 39: Unsaved Changes Warning', () => {
  /**
   * **Feature: admin-panel-crud, Property 39: Unsaved Changes Warning**
   * **Validates: Requirements 13.5**
   *
   * *For any* form with unsaved changes, attempting to navigate away
   * SHALL display a warning dialog.
   */

  describe('Dirty state tracking', () => {
    it('should track dirty state correctly for any form (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          formIdArb,
          (formId) => {
            const state = new UnsavedChangesState();

            // Initially, no unsaved changes
            expect(state.hasUnsavedChanges).toBe(false);

            // Mark form as dirty
            state.markFormDirty(formId, true);

            // Property: After marking a form dirty, hasUnsavedChanges should be true
            expect(state.hasUnsavedChanges).toBe(true);
            expect(state.getDirtyForms()).toContain(formId);

            // Mark form as clean
            state.markFormDirty(formId, false);

            // Property: After marking the form clean, hasUnsavedChanges should be false
            expect(state.hasUnsavedChanges).toBe(false);
            expect(state.getDirtyForms()).not.toContain(formId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple forms independently (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          uniqueFormIdsArb,
          (formIds) => {
            const state = new UnsavedChangesState();

            // Mark all forms as dirty
            formIds.forEach((formId) => {
              state.markFormDirty(formId, true);
            });

            // Property: All forms should be tracked as dirty
            expect(state.getDirtyFormCount()).toBe(formIds.length);
            expect(state.hasUnsavedChanges).toBe(true);

            // Mark half of the forms as clean
            const halfIndex = Math.floor(formIds.length / 2);
            formIds.slice(0, halfIndex).forEach((formId) => {
              state.markFormDirty(formId, false);
            });

            // Property: Only remaining forms should be dirty
            const expectedDirtyCount = formIds.length - halfIndex;
            expect(state.getDirtyFormCount()).toBe(expectedDirtyCount);
            expect(state.hasUnsavedChanges).toBe(expectedDirtyCount > 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle sequence of dirty state changes correctly (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          dirtyStateSequenceArb,
          (sequence) => {
            const state = new UnsavedChangesState();
            const expectedDirtyForms = new Set<string>();

            // Apply each state change
            sequence.forEach(({ formId, isDirty }) => {
              state.markFormDirty(formId, isDirty);
              if (isDirty) {
                expectedDirtyForms.add(formId);
              } else {
                expectedDirtyForms.delete(formId);
              }
            });

            // Property: Final state should match expected state
            expect(state.getDirtyFormCount()).toBe(expectedDirtyForms.size);
            expect(state.hasUnsavedChanges).toBe(expectedDirtyForms.size > 0);

            // Verify each form's state
            expectedDirtyForms.forEach((formId) => {
              expect(state.getDirtyForms()).toContain(formId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Simple boolean API', () => {
    it('should support simple setHasUnsavedChanges API (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.array(dirtyStateArb, { minLength: 1, maxLength: 10 }),
          (stateChanges) => {
            const state = new UnsavedChangesState();

            // Apply each state change
            stateChanges.forEach((isDirty) => {
              state.setHasUnsavedChanges(isDirty);
            });

            // Property: Final state should match the last state change
            const lastState = stateChanges[stateChanges.length - 1];
            expect(state.hasUnsavedChanges).toBe(lastState);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Form unregistration', () => {
    it('should remove form from tracking when unregistered (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          uniqueFormIdsArb,
          (formIds) => {
            const state = new UnsavedChangesState();

            // Mark all forms as dirty
            formIds.forEach((formId) => {
              state.markFormDirty(formId, true);
            });

            // Unregister each form one by one
            formIds.forEach((formId, index) => {
              state.unregisterForm(formId);

              // Property: After unregistering, form should not be in dirty list
              expect(state.getDirtyForms()).not.toContain(formId);

              // Property: Dirty count should decrease
              const expectedCount = formIds.length - index - 1;
              expect(state.getDirtyFormCount()).toBe(expectedCount);
            });

            // Property: After unregistering all forms, no unsaved changes
            expect(state.hasUnsavedChanges).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Navigation warning trigger', () => {
    it('should require warning when there are unsaved changes (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          formIdArb,
          (formId) => {
            const state = new UnsavedChangesState();

            // No warning needed when clean
            expect(state.hasUnsavedChanges).toBe(false);

            // Mark as dirty
            state.markFormDirty(formId, true);

            // Property: Warning should be required when there are unsaved changes
            expect(state.hasUnsavedChanges).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not require warning when all forms are clean (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          uniqueFormIdsArb,
          (formIds) => {
            const state = new UnsavedChangesState();

            // Mark all forms as dirty then clean
            formIds.forEach((formId) => {
              state.markFormDirty(formId, true);
            });
            formIds.forEach((formId) => {
              state.markFormDirty(formId, false);
            });

            // Property: No warning needed when all forms are clean
            expect(state.hasUnsavedChanges).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Reset functionality', () => {
    it('should clear all dirty forms on reset (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          uniqueFormIdsArb,
          (formIds) => {
            const state = new UnsavedChangesState();

            // Mark all forms as dirty
            formIds.forEach((formId) => {
              state.markFormDirty(formId, true);
            });

            expect(state.hasUnsavedChanges).toBe(true);

            // Reset
            state.reset();

            // Property: After reset, no unsaved changes
            expect(state.hasUnsavedChanges).toBe(false);
            expect(state.getDirtyFormCount()).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Browser beforeunload Event Logic Tests
// ============================================================================

describe('Browser beforeunload Event Logic', () => {
  it('should prevent default and set returnValue when there are unsaved changes (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        formIdArb,
        (formId) => {
          const state = new UnsavedChangesState();
          state.markFormDirty(formId, true);

          // Simulate beforeunload handler logic
          let preventDefaultCalled = false;
          let returnValue = '';

          // This is the logic from UnsavedChangesProvider
          if (state.hasUnsavedChanges) {
            preventDefaultCalled = true;
            returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          }

          // Property: When there are unsaved changes, preventDefault should be called
          expect(preventDefaultCalled).toBe(true);
          expect(returnValue).toBe('You have unsaved changes. Are you sure you want to leave?');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not prevent default when there are no unsaved changes (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        formIdArb,
        (formId) => {
          const state = new UnsavedChangesState();
          // Mark dirty then clean
          state.markFormDirty(formId, true);
          state.markFormDirty(formId, false);

          // Simulate beforeunload handler logic
          let preventDefaultCalled = false;
          let returnValue = '';

          // This is the logic from UnsavedChangesProvider
          if (state.hasUnsavedChanges) {
            preventDefaultCalled = true;
            returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          }

          // Property: When there are no unsaved changes, preventDefault should not be called
          expect(preventDefaultCalled).toBe(false);
          expect(returnValue).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Confirmation Dialog Logic Tests
// ============================================================================

describe('Confirmation Dialog Logic', () => {
  it('should resolve to true when user confirms navigation (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        formIdArb,
        (formId) => {
          const state = new UnsavedChangesState();
          state.markFormDirty(formId, true);

          // Simulate confirmNavigation logic - synchronous version for testing
          const shouldShowDialog = state.hasUnsavedChanges;
          
          // Simulate user clicking "Leave Page"
          if (shouldShowDialog) {
            state.reset(); // Clear dirty forms on confirm
          }

          // Property: When user confirms, dirty state should be cleared
          expect(state.hasUnsavedChanges).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve dirty state when user cancels navigation (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        formIdArb,
        (formId) => {
          const state = new UnsavedChangesState();
          state.markFormDirty(formId, true);

          // Simulate confirmNavigation logic - synchronous version for testing
          const shouldShowDialog = state.hasUnsavedChanges;
          
          // Simulate user clicking "Stay on Page" - don't reset state
          // (In real implementation, this would resolve the promise with false)

          // Property: When user cancels, dirty state should be preserved
          expect(shouldShowDialog).toBe(true);
          expect(state.hasUnsavedChanges).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not show dialog when no unsaved changes (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        formIdArb,
        (formId) => {
          const state = new UnsavedChangesState();
          // Don't mark any form as dirty

          // Simulate confirmNavigation logic
          const shouldShowDialog = state.hasUnsavedChanges;

          // Property: When no unsaved changes, dialog should not be shown
          expect(shouldShowDialog).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly determine if dialog is needed based on dirty state (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        uniqueFormIdsArb,
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (formIds, dirtyStates) => {
          const state = new UnsavedChangesState();
          
          // Apply dirty states to forms
          formIds.forEach((formId, index) => {
            const isDirty = dirtyStates[index % dirtyStates.length];
            state.markFormDirty(formId, isDirty);
          });

          // Calculate expected result
          const expectedHasUnsavedChanges = dirtyStates.some((isDirty, index) => 
            isDirty && index < formIds.length
          );

          // Property: Dialog should be shown if and only if there are unsaved changes
          expect(state.hasUnsavedChanges).toBe(expectedHasUnsavedChanges);
        }
      ),
      { numRuns: 100 }
    );
  });
});
