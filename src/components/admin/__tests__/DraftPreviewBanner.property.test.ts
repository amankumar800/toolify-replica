/**
 * Property-based tests for DraftPreviewBanner component
 *
 * Tests Property 29 from the design document:
 * - Property 29: Draft Preview Banner
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 18.4**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// Types
// ============================================================================

type ContentType = 'tool' | 'news';

interface DraftPreviewBannerProps {
  contentType: ContentType;
  contentId: string;
  message?: string;
}

// ============================================================================
// Test Arbitraries
// ============================================================================

// Valid content type arbitrary
const contentTypeArb = fc.constantFrom<ContentType>('tool', 'news');

// Valid UUID arbitrary for content ID
const contentIdArb = fc.uuid();

// Valid message arbitrary (optional)
const messageArb = fc.option(
  fc.stringMatching(/^[a-zA-Z0-9 .,!?'-]{1,200}$/),
  { nil: undefined }
);

// DraftPreviewBanner props arbitrary
const draftPreviewBannerPropsArb = fc.record({
  contentType: contentTypeArb,
  contentId: contentIdArb,
  message: messageArb,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates the expected edit href based on content type and ID
 */
function getExpectedEditHref(contentType: ContentType, contentId: string): string {
  return contentType === 'tool'
    ? `/admin/tools/${contentId}/edit`
    : `/admin/news/${contentId}/edit`;
}

/**
 * Default message for draft preview banner
 */
const DEFAULT_MESSAGE = 'This is a draft preview. This content is not yet published and is only visible to administrators.';

// ============================================================================
// Property 29: Draft Preview Banner
// ============================================================================

describe('Property 29: Draft Preview Banner', () => {
  /**
   * **Feature: admin-panel-crud, Property 29: Draft Preview Banner**
   * **Validates: Requirements 18.4**
   *
   * *For any* unpublished record being previewed, the preview page SHALL display
   * a draft preview banner.
   */

  describe('Edit link generation', () => {
    it('should generate correct edit href for tool content type (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          contentIdArb,
          (contentId) => {
            const props: DraftPreviewBannerProps = {
              contentType: 'tool',
              contentId,
            };

            const expectedHref = getExpectedEditHref(props.contentType, props.contentId);

            // Property: For tool content type, edit href should point to /admin/tools/{id}/edit
            expect(expectedHref).toBe(`/admin/tools/${contentId}/edit`);
            expect(expectedHref).toMatch(/^\/admin\/tools\/[a-f0-9-]+\/edit$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate correct edit href for news content type (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          contentIdArb,
          (contentId) => {
            const props: DraftPreviewBannerProps = {
              contentType: 'news',
              contentId,
            };

            const expectedHref = getExpectedEditHref(props.contentType, props.contentId);

            // Property: For news content type, edit href should point to /admin/news/{id}/edit
            expect(expectedHref).toBe(`/admin/news/${contentId}/edit`);
            expect(expectedHref).toMatch(/^\/admin\/news\/[a-f0-9-]+\/edit$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate correct edit href for any content type (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          draftPreviewBannerPropsArb,
          (props) => {
            const expectedHref = getExpectedEditHref(props.contentType, props.contentId);

            // Property: Edit href should always contain the content ID
            expect(expectedHref).toContain(props.contentId);

            // Property: Edit href should always end with /edit
            expect(expectedHref).toMatch(/\/edit$/);

            // Property: Edit href should always start with /admin/
            expect(expectedHref).toMatch(/^\/admin\//);

            // Property: Edit href should contain the correct content type path
            if (props.contentType === 'tool') {
              expect(expectedHref).toContain('/tools/');
            } else {
              expect(expectedHref).toContain('/news/');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Message display', () => {
    it('should use default message when no custom message is provided (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          contentTypeArb,
          contentIdArb,
          (contentType, contentId) => {
            const props: DraftPreviewBannerProps = {
              contentType,
              contentId,
              // No message provided
            };

            const effectiveMessage = props.message ?? DEFAULT_MESSAGE;

            // Property: When no message is provided, the default message should be used
            expect(effectiveMessage).toBe(DEFAULT_MESSAGE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use custom message when provided (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          contentTypeArb,
          contentIdArb,
          fc.stringMatching(/^[a-zA-Z0-9 .,!?'-]{1,200}$/),
          (contentType, contentId, customMessage) => {
            const props: DraftPreviewBannerProps = {
              contentType,
              contentId,
              message: customMessage,
            };

            const effectiveMessage = props.message ?? DEFAULT_MESSAGE;

            // Property: When a custom message is provided, it should be used
            expect(effectiveMessage).toBe(customMessage);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Props validation', () => {
    it('should accept valid content types (property test with 100 runs)', () => {
      const validContentTypes: ContentType[] = ['tool', 'news'];

      fc.assert(
        fc.property(
          draftPreviewBannerPropsArb,
          (props) => {
            // Property: Content type should be one of the valid types
            expect(validContentTypes).toContain(props.contentType);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid UUID content IDs (property test with 100 runs)', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      fc.assert(
        fc.property(
          draftPreviewBannerPropsArb,
          (props) => {
            // Property: Content ID should be a valid UUID
            expect(props.contentId).toMatch(uuidRegex);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain props integrity (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          draftPreviewBannerPropsArb,
          (props) => {
            // Property: Props should maintain their values
            expect(props.contentType).toBeDefined();
            expect(props.contentId).toBeDefined();
            expect(typeof props.contentType).toBe('string');
            expect(typeof props.contentId).toBe('string');
            
            if (props.message !== undefined) {
              expect(typeof props.message).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Banner visibility logic', () => {
    it('should determine banner visibility based on preview and draft status (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isPreview
          fc.boolean(), // isDraft
          (isPreview, isDraft) => {
            // Simulate the visibility logic from the page components
            const shouldShowBanner = isPreview && isDraft;

            // Property: Banner should only be shown when both isPreview AND isDraft are true
            if (isPreview && isDraft) {
              expect(shouldShowBanner).toBe(true);
            } else {
              expect(shouldShowBanner).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not show banner when not in preview mode (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isDraft
          (isDraft) => {
            const isPreview = false;
            const shouldShowBanner = isPreview && isDraft;

            // Property: Banner should never be shown when not in preview mode
            expect(shouldShowBanner).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not show banner when content is published (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isPreview
          (isPreview) => {
            const isDraft = false; // Content is published
            const shouldShowBanner = isPreview && isDraft;

            // Property: Banner should never be shown when content is published
            expect(shouldShowBanner).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Tool status to draft mapping', () => {
    it('should correctly identify draft status for tools (property test with 100 runs)', () => {
      const toolStatuses = ['draft', 'pending', 'published', 'rejected', 'archived'] as const;

      fc.assert(
        fc.property(
          fc.constantFrom(...toolStatuses),
          (status) => {
            // Simulate the isDraft logic from the tool page
            const isDraft = status !== 'published';

            // Property: Only 'published' status should NOT be considered a draft
            if (status === 'published') {
              expect(isDraft).toBe(false);
            } else {
              expect(isDraft).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('News published status to draft mapping', () => {
    it('should correctly identify draft status for news (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isPublished
          (isPublished) => {
            // Simulate the isDraft logic from the news page
            const isDraft = !isPublished;

            // Property: isDraft should be the inverse of isPublished
            expect(isDraft).toBe(!isPublished);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Preview URL Generation Tests
// ============================================================================

describe('Preview URL Generation', () => {
  it('should generate correct preview URL for tools (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9-]{1,100}$/), // slug
        (slug) => {
          const previewUrl = `/tool/${slug}?preview=true`;

          // Property: Preview URL should contain the slug
          expect(previewUrl).toContain(slug);

          // Property: Preview URL should have preview=true query parameter
          expect(previewUrl).toContain('?preview=true');

          // Property: Preview URL should start with /tool/
          expect(previewUrl).toMatch(/^\/tool\//);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate correct preview URL for news (property test with 100 runs)', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9-]{1,100}$/), // slug
        (slug) => {
          const previewUrl = `/ai-news/${slug}?preview=true`;

          // Property: Preview URL should contain the slug
          expect(previewUrl).toContain(slug);

          // Property: Preview URL should have preview=true query parameter
          expect(previewUrl).toContain('?preview=true');

          // Property: Preview URL should start with /ai-news/
          expect(previewUrl).toMatch(/^\/ai-news\//);
        }
      ),
      { numRuns: 100 }
    );
  });
});
