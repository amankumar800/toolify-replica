/**
 * Property-based tests for Tools Management
 *
 * Tests Properties 10, 11, 28, 30, 31, and 33 from the design document:
 * - Property 10: Search Vector Generation
 * - Property 11: Junction Table Synchronization
 * - Property 28: Preview Button State
 * - Property 30: Soft Delete Lifecycle
 * - Property 31: Archived Tool Display
 * - Property 33: Duplicate Detection
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 3.10, 3.11, 18.3, 19.2, 19.4, 19.5, 19.7, 21.1, 21.2, 21.3, 21.5**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Test Data Types
// ============================================================================

interface ToolData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
  website_url: string;
}

interface CategoryAssignment {
  toolId: string;
  categoryIds: string[];
}

// ============================================================================
// Test Arbitraries
// ============================================================================

// Arbitrary for tool names
const toolNameArb = fc.string({ minLength: 2, maxLength: 100 })
  .filter(s => /^[a-zA-Z0-9 ]+$/.test(s) && s.trim().length >= 2);

// Arbitrary for tool slugs
const toolSlugArb = fc.string({ minLength: 2, maxLength: 100 })
  .filter(s => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s));

// Arbitrary for descriptions
const descriptionArb = fc.option(
  fc.string({ minLength: 0, maxLength: 500 }),
  { nil: null }
);

// Arbitrary for tool status
const toolStatusArb = fc.constantFrom(
  'draft', 'pending', 'published', 'rejected', 'archived'
) as fc.Arbitrary<'draft' | 'pending' | 'published' | 'rejected' | 'archived'>;

// Arbitrary for non-archived status
const nonArchivedStatusArb = fc.constantFrom(
  'draft', 'pending', 'published', 'rejected'
) as fc.Arbitrary<'draft' | 'pending' | 'published' | 'rejected'>;

// Arbitrary for website URLs
const websiteUrlArb = fc.webUrl();

// Arbitrary for UUIDs
const uuidArb = fc.uuid();

// Arbitrary for tool data
const toolDataArb = fc.record({
  id: uuidArb,
  name: toolNameArb,
  slug: toolSlugArb,
  description: descriptionArb,
  status: toolStatusArb,
  website_url: websiteUrlArb,
});

// Arbitrary for category IDs (array of UUIDs)
const categoryIdsArb = fc.array(uuidArb, { minLength: 0, maxLength: 10 });

// Arbitrary for similarity scores (0-100)
const similarityScoreArb = fc.integer({ min: 0, max: 100 });

// ============================================================================
// Helper Functions (Pure logic extracted from service)
// ============================================================================

/**
 * Generate search vector from name and description
 * This simulates what the database GENERATED ALWAYS AS column does
 */
function generateSearchVector(name: string, description: string | null): string {
  const parts: string[] = [];
  
  if (name) {
    // Weight A for name (highest priority)
    parts.push(`'${name.toLowerCase().replace(/'/g, "''")}':A`);
  }
  
  if (description) {
    // Weight B for description
    parts.push(`'${description.toLowerCase().replace(/'/g, "''")}':B`);
  }
  
  return parts.join(' ');
}

/**
 * Sync tool categories - returns the expected state after sync
 */
function syncToolCategories(
  existingLinks: { toolId: string; categoryId: string }[],
  toolId: string,
  newCategoryIds: string[]
): { toolId: string; categoryId: string }[] {
  // Remove all existing links for this tool
  const otherLinks = existingLinks.filter(link => link.toolId !== toolId);
  
  // Add new links
  const newLinks = newCategoryIds.map(categoryId => ({
    toolId,
    categoryId,
  }));
  
  return [...otherLinks, ...newLinks];
}

/**
 * Determine if preview button should be enabled
 */
function isPreviewEnabled(isNew: boolean, slug: string | null): boolean {
  // Preview is disabled for new records or if no slug
  return !isNew && !!slug && slug.length > 0;
}

/**
 * Soft delete a tool - returns new status
 */
function softDeleteTool(currentStatus: string): 'archived' {
  return 'archived';
}

/**
 * Restore an archived tool - returns new status
 */
function restoreTool(currentStatus: string): 'draft' {
  if (currentStatus !== 'archived') {
    throw new Error('Can only restore archived tools');
  }
  return 'draft';
}

/**
 * Check if tool should be visible on public website
 */
function isVisibleOnPublicSite(status: string): boolean {
  return status === 'published';
}

/**
 * Get row class name for archived tools
 */
function getArchivedRowClassName(status: string): string {
  return status === 'archived' ? 'bg-gray-100' : '';
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Check for duplicate tools
 */
function checkForDuplicates(
  existingTools: { id: string; name: string; website_url: string }[],
  newName: string,
  newUrl: string,
  excludeId?: string
): { hasDuplicates: boolean; matches: { id: string; matchType: 'name' | 'url'; matchScore: number }[] } {
  const matches: { id: string; matchType: 'name' | 'url'; matchScore: number }[] = [];
  
  for (const tool of existingTools) {
    if (excludeId && tool.id === excludeId) continue;
    
    // Check name similarity
    const nameSimilarity = calculateSimilarity(newName, tool.name);
    if (nameSimilarity >= 80) {
      matches.push({
        id: tool.id,
        matchType: 'name',
        matchScore: nameSimilarity,
      });
    }
    
    // Check URL match
    if (newUrl && tool.website_url === newUrl) {
      // Don't add if already matched by name
      if (!matches.some(m => m.id === tool.id)) {
        matches.push({
          id: tool.id,
          matchType: 'url',
          matchScore: 100,
        });
      }
    }
  }
  
  return {
    hasDuplicates: matches.length > 0,
    matches,
  };
}


// ============================================================================
// Property 10: Search Vector Generation
// ============================================================================

describe('Property 10: Search Vector Generation', () => {
  /**
   * **Feature: admin-panel-crud, Property 10: Search Vector Generation**
   * **Validates: Requirements 3.10**
   *
   * *For any* tool being saved, the search_vector field SHALL be automatically
   * generated from the tool's name and description fields.
   */

  it('should generate search vector containing name (property test with 100 runs)', () => {
    fc.assert(
      fc.property(toolNameArb, descriptionArb, (name, description) => {
        const searchVector = generateSearchVector(name, description);
        
        // Property: Search vector should contain the name
        expect(searchVector.toLowerCase()).toContain(name.toLowerCase().replace(/'/g, "''"));
      }),
      { numRuns: 100 }
    );
  });

  it('should generate search vector containing description when provided (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        toolNameArb,
        fc.string({ minLength: 1, maxLength: 500 }),
        (name, description) => {
          const searchVector = generateSearchVector(name, description);
          
          // Property: Search vector should contain the description
          expect(searchVector.toLowerCase()).toContain(description.toLowerCase().replace(/'/g, "''"));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle null description gracefully (property test with 100 runs)', () => {
    fc.assert(
      fc.property(toolNameArb, (name) => {
        const searchVector = generateSearchVector(name, null);
        
        // Property: Search vector should still be generated with just name
        expect(searchVector.length).toBeGreaterThan(0);
        expect(searchVector.toLowerCase()).toContain(name.toLowerCase().replace(/'/g, "''"));
      }),
      { numRuns: 100 }
    );
  });

  it('should assign higher weight to name than description', () => {
    const name = 'ChatGPT';
    const description = 'An AI assistant';
    
    const searchVector = generateSearchVector(name, description);
    
    // Property: Name should have weight A, description should have weight B
    expect(searchVector).toContain(':A');
    expect(searchVector).toContain(':B');
  });
});


// ============================================================================
// Property 11: Junction Table Synchronization
// ============================================================================

describe('Property 11: Junction Table Synchronization', () => {
  /**
   * **Feature: admin-panel-crud, Property 11: Junction Table Synchronization**
   * **Validates: Requirements 3.11**
   *
   * *For any* tool with category assignments, saving the tool SHALL result in
   * the tool_categories junction table containing exactly the assigned category
   * relationships.
   */

  it('should sync categories to exactly match new assignments (property test with 100 runs)', () => {
    fc.assert(
      fc.property(uuidArb, categoryIdsArb, categoryIdsArb, (toolId, existingCategoryIds, newCategoryIds) => {
        // Create existing links
        const existingLinks = existingCategoryIds.map(categoryId => ({
          toolId,
          categoryId,
        }));
        
        // Sync to new categories
        const result = syncToolCategories(existingLinks, toolId, newCategoryIds);
        
        // Property: Result should contain exactly the new category IDs for this tool
        const toolLinks = result.filter(link => link.toolId === toolId);
        const resultCategoryIds = toolLinks.map(link => link.categoryId);
        
        expect(resultCategoryIds.sort()).toEqual([...newCategoryIds].sort());
      }),
      { numRuns: 100 }
    );
  });

  it('should remove all categories when syncing to empty array (property test with 100 runs)', () => {
    fc.assert(
      fc.property(uuidArb, categoryIdsArb, (toolId, existingCategoryIds) => {
        // Create existing links
        const existingLinks = existingCategoryIds.map(categoryId => ({
          toolId,
          categoryId,
        }));
        
        // Sync to empty array
        const result = syncToolCategories(existingLinks, toolId, []);
        
        // Property: No links should remain for this tool
        const toolLinks = result.filter(link => link.toolId === toolId);
        expect(toolLinks.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should not affect other tools categories (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        categoryIdsArb,
        categoryIdsArb,
        categoryIdsArb,
        (toolId1, toolId2, tool1Categories, tool2Categories, newCategories) => {
          // Ensure different tool IDs
          if (toolId1 === toolId2) return true;
          
          // Create existing links for both tools
          const existingLinks = [
            ...tool1Categories.map(categoryId => ({ toolId: toolId1, categoryId })),
            ...tool2Categories.map(categoryId => ({ toolId: toolId2, categoryId })),
          ];
          
          // Sync only tool1's categories
          const result = syncToolCategories(existingLinks, toolId1, newCategories);
          
          // Property: Tool2's categories should remain unchanged
          const tool2Links = result.filter(link => link.toolId === toolId2);
          const tool2ResultCategories = tool2Links.map(link => link.categoryId);
          
          expect(tool2ResultCategories.sort()).toEqual([...tool2Categories].sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle duplicate category IDs in input (property test with 100 runs)', () => {
    fc.assert(
      fc.property(uuidArb, categoryIdsArb, (toolId, categoryIds) => {
        // Create duplicates
        const duplicatedIds = [...categoryIds, ...categoryIds];
        
        const result = syncToolCategories([], toolId, duplicatedIds);
        
        // Property: Result should contain duplicates as provided
        // (deduplication is handled at the database level with unique constraint)
        const toolLinks = result.filter(link => link.toolId === toolId);
        expect(toolLinks.length).toBe(duplicatedIds.length);
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 28: Preview Button State
// ============================================================================

describe('Property 28: Preview Button State', () => {
  /**
   * **Feature: admin-panel-crud, Property 28: Preview Button State**
   * **Validates: Requirements 18.3**
   *
   * *For any* unsaved (new) record, the Preview button SHALL be disabled.
   */

  it('should disable preview for new records (property test with 100 runs)', () => {
    fc.assert(
      fc.property(toolSlugArb, (slug) => {
        const isNew = true;
        const enabled = isPreviewEnabled(isNew, slug);
        
        // Property: Preview should be disabled for new records
        expect(enabled).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should enable preview for existing records with slug (property test with 100 runs)', () => {
    fc.assert(
      fc.property(toolSlugArb, (slug) => {
        const isNew = false;
        const enabled = isPreviewEnabled(isNew, slug);
        
        // Property: Preview should be enabled for existing records with slug
        expect(enabled).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should disable preview for existing records without slug', () => {
    const isNew = false;
    
    expect(isPreviewEnabled(isNew, null)).toBe(false);
    expect(isPreviewEnabled(isNew, '')).toBe(false);
  });

  it('should correctly determine preview state for all combinations', () => {
    // New record, no slug
    expect(isPreviewEnabled(true, null)).toBe(false);
    expect(isPreviewEnabled(true, '')).toBe(false);
    
    // New record, with slug
    expect(isPreviewEnabled(true, 'test-slug')).toBe(false);
    
    // Existing record, no slug
    expect(isPreviewEnabled(false, null)).toBe(false);
    expect(isPreviewEnabled(false, '')).toBe(false);
    
    // Existing record, with slug
    expect(isPreviewEnabled(false, 'test-slug')).toBe(true);
  });
});


// ============================================================================
// Property 30: Soft Delete Lifecycle
// ============================================================================

describe('Property 30: Soft Delete Lifecycle', () => {
  /**
   * **Feature: admin-panel-crud, Property 30: Soft Delete Lifecycle**
   * **Validates: Requirements 19.2, 19.5, 19.7**
   *
   * *For any* tool, clicking "Delete" SHALL change status to "archived",
   * clicking "Restore" on an archived tool SHALL change status to "draft",
   * and archived tools SHALL NOT appear on the public website.
   */

  it('should change status to archived on soft delete (property test with 100 runs)', () => {
    fc.assert(
      fc.property(nonArchivedStatusArb, (currentStatus) => {
        const newStatus = softDeleteTool(currentStatus);
        
        // Property: Status should become archived
        expect(newStatus).toBe('archived');
      }),
      { numRuns: 100 }
    );
  });

  it('should change status to draft on restore (property test with 100 runs)', () => {
    fc.assert(
      fc.property(fc.constant('archived'), () => {
        const newStatus = restoreTool('archived');
        
        // Property: Status should become draft
        expect(newStatus).toBe('draft');
      }),
      { numRuns: 100 }
    );
  });

  it('should throw error when restoring non-archived tool', () => {
    const nonArchivedStatuses = ['draft', 'pending', 'published', 'rejected'];
    
    nonArchivedStatuses.forEach(status => {
      expect(() => restoreTool(status)).toThrow('Can only restore archived tools');
    });
  });

  it('should not show archived tools on public site (property test with 100 runs)', () => {
    fc.assert(
      fc.property(toolStatusArb, (status) => {
        const isVisible = isVisibleOnPublicSite(status);
        
        // Property: Only published tools should be visible
        if (status === 'published') {
          expect(isVisible).toBe(true);
        } else {
          expect(isVisible).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should complete full soft delete lifecycle', () => {
    // Start with published tool
    let status: string = 'published';
    expect(isVisibleOnPublicSite(status)).toBe(true);
    
    // Soft delete
    status = softDeleteTool(status);
    expect(status).toBe('archived');
    expect(isVisibleOnPublicSite(status)).toBe(false);
    
    // Restore
    status = restoreTool(status);
    expect(status).toBe('draft');
    expect(isVisibleOnPublicSite(status)).toBe(false);
  });
});


// ============================================================================
// Property 31: Archived Tool Display
// ============================================================================

describe('Property 31: Archived Tool Display', () => {
  /**
   * **Feature: admin-panel-crud, Property 31: Archived Tool Display**
   * **Validates: Requirements 19.4**
   *
   * *For any* archived tool in the Tools_List, it SHALL be displayed with
   * a gray background.
   */

  it('should return gray background class for archived tools (property test with 100 runs)', () => {
    fc.assert(
      fc.property(fc.constant('archived'), () => {
        const className = getArchivedRowClassName('archived');
        
        // Property: Archived tools should have gray background
        expect(className).toBe('bg-gray-100');
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty class for non-archived tools (property test with 100 runs)', () => {
    fc.assert(
      fc.property(nonArchivedStatusArb, (status) => {
        const className = getArchivedRowClassName(status);
        
        // Property: Non-archived tools should have no special class
        expect(className).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly style all status types', () => {
    expect(getArchivedRowClassName('draft')).toBe('');
    expect(getArchivedRowClassName('pending')).toBe('');
    expect(getArchivedRowClassName('published')).toBe('');
    expect(getArchivedRowClassName('rejected')).toBe('');
    expect(getArchivedRowClassName('archived')).toBe('bg-gray-100');
  });
});


// ============================================================================
// Property 33: Duplicate Detection
// ============================================================================

describe('Property 33: Duplicate Detection', () => {
  /**
   * **Feature: admin-panel-crud, Property 33: Duplicate Detection**
   * **Validates: Requirements 21.1, 21.2, 21.3, 21.5**
   *
   * *For any* new tool being created, the system SHALL check for existing tools
   * with similar names (fuzzy match > 80%) and same website_url, display a
   * warning if duplicates are found, but NOT block creation.
   */

  it('should detect exact name matches (property test with 100 runs)', () => {
    fc.assert(
      fc.property(toolNameArb, websiteUrlArb, uuidArb, (name, url, existingId) => {
        const existingTools = [{ id: existingId, name, website_url: 'https://other.com' }];
        
        const result = checkForDuplicates(existingTools, name, url);
        
        // Property: Exact name match should be detected with 100% score
        expect(result.hasDuplicates).toBe(true);
        expect(result.matches.some(m => m.matchScore === 100 && m.matchType === 'name')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect exact URL matches (property test with 100 runs)', () => {
    fc.assert(
      fc.property(toolNameArb, websiteUrlArb, uuidArb, (name, url, existingId) => {
        const existingTools = [{ id: existingId, name: 'Different Name', website_url: url }];
        
        const result = checkForDuplicates(existingTools, name, url);
        
        // Property: Exact URL match should be detected with 100% score
        expect(result.hasDuplicates).toBe(true);
        expect(result.matches.some(m => m.matchScore === 100 && m.matchType === 'url')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should detect similar names with >= 80% match (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => /^[a-zA-Z0-9 ]+$/.test(s)),
        uuidArb,
        (baseName, existingId) => {
          // Create a slightly modified name (change 1-2 characters)
          const modifiedName = baseName.slice(0, -1) + 'x';
          const existingTools = [{ id: existingId, name: baseName, website_url: 'https://other.com' }];
          
          const result = checkForDuplicates(existingTools, modifiedName, 'https://new.com');
          
          // Property: Similar names should be detected if >= 80% match
          const similarity = calculateSimilarity(baseName, modifiedName);
          if (similarity >= 80) {
            expect(result.hasDuplicates).toBe(true);
            expect(result.matches.some(m => m.matchType === 'name' && m.matchScore >= 80)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not detect dissimilar names (< 80% match)', () => {
    const existingTools = [{ id: '1', name: 'ChatGPT', website_url: 'https://chatgpt.com' }];
    
    const result = checkForDuplicates(existingTools, 'Completely Different Tool', 'https://other.com');
    
    // Property: Dissimilar names should not be flagged
    expect(result.matches.filter(m => m.matchType === 'name').length).toBe(0);
  });

  it('should exclude specified tool ID from results (property test with 100 runs)', () => {
    fc.assert(
      fc.property(toolNameArb, websiteUrlArb, uuidArb, (name, url, toolId) => {
        const existingTools = [{ id: toolId, name, website_url: url }];
        
        const result = checkForDuplicates(existingTools, name, url, toolId);
        
        // Property: Excluded ID should not appear in matches
        expect(result.matches.some(m => m.id === toolId)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty matches when no duplicates found', () => {
    const existingTools = [
      { id: '1', name: 'Tool A', website_url: 'https://a.com' },
      { id: '2', name: 'Tool B', website_url: 'https://b.com' },
    ];
    
    const result = checkForDuplicates(existingTools, 'Completely Unique Tool', 'https://unique.com');
    
    // Property: No duplicates should be found
    expect(result.hasDuplicates).toBe(false);
    expect(result.matches.length).toBe(0);
  });

  it('should not block creation even when duplicates found', () => {
    const existingTools = [{ id: '1', name: 'ChatGPT', website_url: 'https://chatgpt.com' }];
    
    const result = checkForDuplicates(existingTools, 'ChatGPT', 'https://chatgpt.com');
    
    // Property: Result should indicate duplicates but not throw or block
    expect(result.hasDuplicates).toBe(true);
    // The function returns normally, allowing the caller to decide what to do
    expect(typeof result.hasDuplicates).toBe('boolean');
    expect(Array.isArray(result.matches)).toBe(true);
  });

  it('should calculate similarity correctly for identical strings', () => {
    expect(calculateSimilarity('ChatGPT', 'ChatGPT')).toBe(100);
    expect(calculateSimilarity('test', 'test')).toBe(100);
  });

  it('should calculate similarity correctly for completely different strings', () => {
    const similarity = calculateSimilarity('abc', 'xyz');
    expect(similarity).toBeLessThan(50);
  });

  it('should be case-insensitive for similarity calculation', () => {
    expect(calculateSimilarity('ChatGPT', 'chatgpt')).toBe(100);
    expect(calculateSimilarity('TOOL', 'tool')).toBe(100);
  });
});


// ============================================================================
// Additional Edge Case Tests
// ============================================================================

describe('Tools Management Edge Cases', () => {
  it('should handle empty tool name in search vector', () => {
    // Edge case: empty name should return empty search vector
    const searchVector = generateSearchVector('', null);
    // When name is empty, the search vector will be empty since there's nothing to index
    expect(searchVector).toBe('');
  });

  it('should handle special characters in search vector', () => {
    const name = "Tool's Name";
    const searchVector = generateSearchVector(name, null);
    
    // Property: Single quotes should be escaped
    expect(searchVector).toContain("tool''s name");
  });

  it('should handle empty category sync', () => {
    const result = syncToolCategories([], 'tool-1', []);
    expect(result.length).toBe(0);
  });

  it('should handle similarity calculation with empty strings', () => {
    expect(calculateSimilarity('', '')).toBe(100);
    expect(calculateSimilarity('test', '')).toBe(0);
    expect(calculateSimilarity('', 'test')).toBe(0);
  });
});
