/**
 * Property-based tests for shortcut limit enforcement trigger
 *
 * **Feature: database-schema-redesign, Property 12: Shortcut Limit Enforcement**
 * **Validates: Requirements 8.8**
 *
 * *For any* user, attempting to create more than 20 shortcuts (is_shortcut = true)
 * SHALL be rejected by the database trigger.
 *
 * To run these tests, you need to set SUPABASE_SERVICE_ROLE_KEY in your environment.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_SERVICE_KEY;

// Maximum shortcuts allowed per user
const MAX_SHORTCUTS = 20;

/**
 * Generate a unique test email
 */
function generateUniqueEmail(): string {
  return `test-shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/**
 * Generate a unique tool ID
 */
function generateUniqueToolId(): string {
  return `tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe.skipIf(shouldSkip)('Property 12: Shortcut Limit Enforcement', { timeout: 300000 }, () => {
  let supabase: SupabaseClient<Database>;
  const testUserFavoriteIds: string[] = [];

  beforeAll(() => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserFavoriteIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from as any)('user_favorites').delete().in('id', testUserFavoriteIds);
    }
  });

  /**
   * Helper to create a shortcut for a user
   */
  async function createShortcut(
    userEmail: string,
    toolId: string
  ): Promise<{ id: string | null; error: Error | null }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('user_favorites')
      .insert({
        user_email: userEmail,
        tool_id: toolId,
        tool_name: `Tool ${toolId}`,
        is_shortcut: true,
      })
      .select('id')
      .single();

    return {
      id: data?.id || null,
      error: error as Error | null,
    };
  }

  /**
   * Helper to create a non-shortcut favorite for a user
   */
  async function createFavorite(
    userEmail: string,
    toolId: string
  ): Promise<{ id: string | null; error: Error | null }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('user_favorites')
      .insert({
        user_email: userEmail,
        tool_id: toolId,
        tool_name: `Tool ${toolId}`,
        is_shortcut: false,
      })
      .select('id')
      .single();

    return {
      id: data?.id || null,
      error: error as Error | null,
    };
  }


  describe('Shortcut Limit Boundary Tests', () => {
    it('should allow creating up to 20 shortcuts for a user', async () => {
      const userEmail = generateUniqueEmail();

      // Create exactly 20 shortcuts
      for (let i = 0; i < MAX_SHORTCUTS; i++) {
        const toolId = generateUniqueToolId();
        const { id, error } = await createShortcut(userEmail, toolId);

        expect(error).toBeNull();
        expect(id).not.toBeNull();

        if (id) {
          testUserFavoriteIds.push(id);
        }
      }

      // Verify we have exactly 20 shortcuts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: shortcuts, error: countError } = await (supabase.from as any)('user_favorites')
        .select('id')
        .eq('user_email', userEmail)
        .eq('is_shortcut', true);

      expect(countError).toBeNull();
      expect(shortcuts?.length).toBe(MAX_SHORTCUTS);
    });

    it('should reject the 21st shortcut for a user', async () => {
      const userEmail = generateUniqueEmail();

      // Create exactly 20 shortcuts
      for (let i = 0; i < MAX_SHORTCUTS; i++) {
        const toolId = generateUniqueToolId();
        const { id, error } = await createShortcut(userEmail, toolId);

        expect(error).toBeNull();
        if (id) {
          testUserFavoriteIds.push(id);
        }
      }

      // Attempt to create the 21st shortcut - should fail
      const toolId21 = generateUniqueToolId();
      const { id: id21, error: error21 } = await createShortcut(userEmail, toolId21);

      // Should fail with an error about the shortcut limit
      expect(error21).not.toBeNull();
      expect(error21?.message).toMatch(/maximum|20|shortcut|limit/i);
      expect(id21).toBeNull();
    });

    it('should allow unlimited non-shortcut favorites', async () => {
      const userEmail = generateUniqueEmail();

      // Create 25 non-shortcut favorites (more than the shortcut limit)
      for (let i = 0; i < 25; i++) {
        const toolId = generateUniqueToolId();
        const { id, error } = await createFavorite(userEmail, toolId);

        expect(error).toBeNull();
        expect(id).not.toBeNull();

        if (id) {
          testUserFavoriteIds.push(id);
        }
      }

      // Verify we have 25 favorites
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: favorites, error: countError } = await (supabase.from as any)('user_favorites')
        .select('id')
        .eq('user_email', userEmail)
        .eq('is_shortcut', false);

      expect(countError).toBeNull();
      expect(favorites?.length).toBe(25);
    });

    it('should allow 20 shortcuts AND unlimited favorites for the same user', async () => {
      const userEmail = generateUniqueEmail();

      // Create 20 shortcuts
      for (let i = 0; i < MAX_SHORTCUTS; i++) {
        const toolId = generateUniqueToolId();
        const { id, error } = await createShortcut(userEmail, toolId);

        expect(error).toBeNull();
        if (id) {
          testUserFavoriteIds.push(id);
        }
      }

      // Create 10 additional non-shortcut favorites
      for (let i = 0; i < 10; i++) {
        const toolId = generateUniqueToolId();
        const { id, error } = await createFavorite(userEmail, toolId);

        expect(error).toBeNull();
        expect(id).not.toBeNull();

        if (id) {
          testUserFavoriteIds.push(id);
        }
      }

      // Verify counts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: shortcuts } = await (supabase.from as any)('user_favorites')
        .select('id')
        .eq('user_email', userEmail)
        .eq('is_shortcut', true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: favorites } = await (supabase.from as any)('user_favorites')
        .select('id')
        .eq('user_email', userEmail)
        .eq('is_shortcut', false);

      expect(shortcuts?.length).toBe(MAX_SHORTCUTS);
      expect(favorites?.length).toBe(10);
    });
  });


  describe('Shortcut Limit Property Tests', () => {
    it('should enforce shortcut limit for any number of shortcuts above 20 (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 21, max: 25 }), // Number of shortcuts to attempt
          async (numShortcuts) => {
            const userEmail = generateUniqueEmail();
            let successCount = 0;
            let failCount = 0;

            // Attempt to create numShortcuts shortcuts
            for (let i = 0; i < numShortcuts; i++) {
              const toolId = generateUniqueToolId();
              const { id, error } = await createShortcut(userEmail, toolId);

              if (error) {
                failCount++;
                // Error should mention the limit
                expect(error.message).toMatch(/maximum|20|shortcut|limit/i);
              } else {
                successCount++;
                if (id) {
                  testUserFavoriteIds.push(id);
                }
              }
            }

            // Property: Exactly 20 should succeed, the rest should fail
            expect(successCount).toBe(MAX_SHORTCUTS);
            expect(failCount).toBe(numShortcuts - MAX_SHORTCUTS);

            return true;
          }
        ),
        { numRuns: 5 } // Limited runs due to the number of DB operations
      );
    }, 300000);

    it('should allow different users to each have 20 shortcuts (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 3 }), // Number of users
          async (numUsers) => {
            const users: string[] = [];

            // Create users and their shortcuts
            for (let u = 0; u < numUsers; u++) {
              const userEmail = generateUniqueEmail();
              users.push(userEmail);

              // Each user creates 20 shortcuts
              for (let i = 0; i < MAX_SHORTCUTS; i++) {
                const toolId = generateUniqueToolId();
                const { id, error } = await createShortcut(userEmail, toolId);

                expect(error).toBeNull();
                if (id) {
                  testUserFavoriteIds.push(id);
                }
              }
            }

            // Property: Each user should have exactly 20 shortcuts
            for (const userEmail of users) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: shortcuts } = await (supabase.from as any)('user_favorites')
                .select('id')
                .eq('user_email', userEmail)
                .eq('is_shortcut', true);

              expect(shortcuts?.length).toBe(MAX_SHORTCUTS);
            }

            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 300000);
  });

  describe('Shortcut Update Tests', () => {
    it('should reject updating a favorite to shortcut when user already has 20 shortcuts', async () => {
      const userEmail = generateUniqueEmail();

      // Create 20 shortcuts
      for (let i = 0; i < MAX_SHORTCUTS; i++) {
        const toolId = generateUniqueToolId();
        const { id, error } = await createShortcut(userEmail, toolId);

        expect(error).toBeNull();
        if (id) {
          testUserFavoriteIds.push(id);
        }
      }

      // Create a non-shortcut favorite
      const extraToolId = generateUniqueToolId();
      const { id: favoriteId, error: favError } = await createFavorite(userEmail, extraToolId);

      expect(favError).toBeNull();
      expect(favoriteId).not.toBeNull();

      if (favoriteId) {
        testUserFavoriteIds.push(favoriteId);

        // Attempt to update the favorite to a shortcut - should fail
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase.from as any)('user_favorites')
          .update({ is_shortcut: true })
          .eq('id', favoriteId);

        // Should fail with an error about the shortcut limit
        expect(updateError).not.toBeNull();
        expect(updateError?.message).toMatch(/maximum|20|shortcut|limit/i);
      }
    });

    it('should allow updating a shortcut to non-shortcut and then creating a new shortcut', async () => {
      const userEmail = generateUniqueEmail();
      const shortcutIds: string[] = [];

      // Create 20 shortcuts
      for (let i = 0; i < MAX_SHORTCUTS; i++) {
        const toolId = generateUniqueToolId();
        const { id, error } = await createShortcut(userEmail, toolId);

        expect(error).toBeNull();
        if (id) {
          testUserFavoriteIds.push(id);
          shortcutIds.push(id);
        }
      }

      // Convert one shortcut to a regular favorite
      const shortcutToConvert = shortcutIds[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from as any)('user_favorites')
        .update({ is_shortcut: false })
        .eq('id', shortcutToConvert);

      expect(updateError).toBeNull();

      // Now we should be able to create a new shortcut
      const newToolId = generateUniqueToolId();
      const { id: newId, error: newError } = await createShortcut(userEmail, newToolId);

      expect(newError).toBeNull();
      expect(newId).not.toBeNull();

      if (newId) {
        testUserFavoriteIds.push(newId);
      }

      // Verify we still have exactly 20 shortcuts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: shortcuts } = await (supabase.from as any)('user_favorites')
        .select('id')
        .eq('user_email', userEmail)
        .eq('is_shortcut', true);

      expect(shortcuts?.length).toBe(MAX_SHORTCUTS);
    });
  });
});
