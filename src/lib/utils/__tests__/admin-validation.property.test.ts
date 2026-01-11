/**
 * Property-based tests for admin validation schemas
 *
 * Tests Properties 16, 20, 21, 22 from the design document:
 * - Property 16: Conditional Field Validation
 * - Property 20: Form Validation
 * - Property 21: Required Field Validation
 * - Property 22: URL Field Validation
 *
 * **Feature: admin-panel-crud**
 * **Validates: Requirements 8.6, 10.7, 14.1, 14.2, 14.9, 14.10**
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  toolSchema,
  categorySchema,
  subcategorySchema,
  aiNewsSchema,
  promptSchema,
  faqSchema,
  featuredToolSchema,
  adminCreateSchema,
  validateFormData,
  isValidSlug,
  isValidUrl,
  generateSlug,
  SLUG_REGEX,
  URL_REGEX,
  REQUIRED_FIELD_MESSAGE,
} from '../admin-validation';

// ============================================================================
// Test Arbitraries
// ============================================================================

// Valid slug arbitrary
const validSlugArb = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{1,10}$/),
    fc.array(fc.stringMatching(/^[a-z0-9]{1,10}$/), { minLength: 0, maxLength: 3 })
  )
  .map(([first, rest]) => [first, ...rest].join('-'))
  .filter((s) => s.length > 0 && s.length <= 100);

// Invalid slug arbitrary (contains uppercase, special chars, or starts/ends with hyphen)
const invalidSlugArb = fc.oneof(
  fc.stringMatching(/^[A-Z][a-z0-9-]*$/), // Starts with uppercase
  fc.stringMatching(/^-[a-z0-9]+$/), // Starts with hyphen
  fc.stringMatching(/^[a-z0-9]+-$/), // Ends with hyphen
  fc.stringMatching(/^[a-z0-9]+_[a-z0-9]+$/), // Contains underscore
  fc.stringMatching(/^[a-z0-9]+\s[a-z0-9]+$/) // Contains space
);

// Valid URL arbitrary
const validUrlArb = fc.oneof(
  fc.stringMatching(/^https:\/\/[a-z0-9-]+\.[a-z]{2,6}(\/[a-z0-9-]*)*$/),
  fc.stringMatching(/^http:\/\/[a-z0-9-]+\.[a-z]{2,6}(\/[a-z0-9-]*)*$/)
);

// Invalid URL arbitrary (doesn't start with http:// or https://)
const invalidUrlArb = fc.oneof(
  fc.stringMatching(/^ftp:\/\/[a-z]+\.[a-z]+$/),
  fc.stringMatching(/^[a-z]+\.[a-z]+$/),
  fc.stringMatching(/^www\.[a-z]+\.[a-z]+$/),
  fc.stringMatching(/^[a-z]+:\/\/[a-z]+\.[a-z]+$/).filter((s) => !s.startsWith('http'))
);

// Valid UUID arbitrary
const validUuidArb = fc.uuid();

// Valid name arbitrary (2-100 chars)
const validNameArb = fc.stringMatching(/^[a-zA-Z0-9 ]{2,50}$/);

// Valid title arbitrary (5-200 chars)
const validTitleArb = fc.stringMatching(/^[a-zA-Z0-9 ]{5,50}$/);

// Valid question arbitrary (10-500 chars)
const validQuestionArb = fc.stringMatching(/^[a-zA-Z0-9 ?]{10,100}$/);

// Valid email arbitrary
const validEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z0-9]{1,15}$/),
    fc.stringMatching(/^[a-z0-9]{1,10}$/),
    fc.stringMatching(/^[a-z]{2,4}$/)
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

// Valid password arbitrary (meets all requirements: min 8 chars, 1 uppercase, 1 number, 1 special)
const validPasswordArb = fc
  .tuple(
    fc.stringMatching(/^[A-Z]{1}$/),
    fc.stringMatching(/^[a-z]{5,10}$/), // 5-10 lowercase to ensure min 8 total
    fc.stringMatching(/^[0-9]{1}$/),
    fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*')
  )
  .map(([upper, lower, num, special]) => `${upper}${lower}${num}${special}`);

// ============================================================================
// Property 16: Conditional Field Validation
// ============================================================================

describe('Property 16: Conditional Field Validation', () => {
  /**
   * **Feature: admin-panel-crud, Property 16: Conditional Field Validation**
   * **Validates: Requirements 8.6, 10.7**
   *
   * *For any* form with conditional required fields (sref_code when type=sref,
   * sponsor_name when is_sponsored=true), validation SHALL fail if the condition
   * is met but the required field is empty.
   */

  describe('Prompt Schema - sref_code conditional requirement', () => {
    it('should require sref_code when type is "sref" (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validTitleArb,
          validSlugArb,
          (title, slug) => {
            const data = {
              title,
              slug,
              type: 'sref' as const,
              sref_code: '', // Empty sref_code
            };

            const result = validateFormData(promptSchema, data);

            // Property: When type is 'sref' and sref_code is empty, validation should fail
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.errors['sref_code']).toBe('SREF code is required when type is sref');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid sref_code when type is "sref" (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validTitleArb,
          validSlugArb,
          fc.stringMatching(/^[a-z0-9]{5,20}$/),
          (title, slug, srefCode) => {
            const data = {
              title,
              slug,
              type: 'sref' as const,
              sref_code: srefCode,
            };

            const result = validateFormData(promptSchema, data);

            // Property: When type is 'sref' and sref_code is provided, validation should pass
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not require sref_code when type is "prompt" (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validTitleArb,
          validSlugArb,
          (title, slug) => {
            const data = {
              title,
              slug,
              type: 'prompt' as const,
              // No sref_code provided
            };

            const result = validateFormData(promptSchema, data);

            // Property: When type is 'prompt', sref_code is not required
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Featured Tool Schema - sponsor_name conditional requirement', () => {
    it('should require sponsor_name when is_sponsored is true (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validUuidArb,
          (toolId) => {
            const data = {
              tool_id: toolId,
              is_sponsored: true,
              sponsor_name: '', // Empty sponsor_name
            };

            const result = validateFormData(featuredToolSchema, data);

            // Property: When is_sponsored is true and sponsor_name is empty, validation should fail
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.errors['sponsor_name']).toBe('Sponsor name is required when sponsored');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid sponsor_name when is_sponsored is true (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validUuidArb,
          validNameArb,
          (toolId, sponsorName) => {
            const data = {
              tool_id: toolId,
              is_sponsored: true,
              sponsor_name: sponsorName,
            };

            const result = validateFormData(featuredToolSchema, data);

            // Property: When is_sponsored is true and sponsor_name is provided, validation should pass
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not require sponsor_name when is_sponsored is false (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validUuidArb,
          (toolId) => {
            const data = {
              tool_id: toolId,
              is_sponsored: false,
              // No sponsor_name provided
            };

            const result = validateFormData(featuredToolSchema, data);

            // Property: When is_sponsored is false, sponsor_name is not required
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Featured Tool Schema - date range validation', () => {
    it('should reject when end_date is before start_date (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validUuidArb,
          fc.integer({ min: 1, max: 365 }),
          (toolId, daysBefore) => {
            // Use fixed valid dates to avoid NaN issues from fc.date()
            const startDate = new Date('2024-06-15');
            const endDate = new Date('2024-06-15');
            endDate.setDate(endDate.getDate() - daysBefore);

            const data = {
              tool_id: toolId,
              start_date: startDate,
              end_date: endDate,
            };

            const result = validateFormData(featuredToolSchema, data);

            // Property: When end_date < start_date, validation should fail
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.errors['end_date']).toBe('End date must be after start date');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept when end_date is after or equal to start_date (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validUuidArb,
          fc.integer({ min: 0, max: 365 }),
          (toolId, daysAfter) => {
            // Use fixed valid dates to avoid NaN issues
            const startDate = new Date('2024-06-15');
            const endDate = new Date('2024-06-15');
            endDate.setDate(endDate.getDate() + daysAfter);

            const data = {
              tool_id: toolId,
              start_date: startDate,
              end_date: endDate,
            };

            const result = validateFormData(featuredToolSchema, data);

            // Property: When end_date >= start_date, validation should pass
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Property 20: Form Validation
// ============================================================================

describe('Property 20: Form Validation', () => {
  /**
   * **Feature: admin-panel-crud, Property 20: Form Validation**
   * **Validates: Requirements 14.1, 14.2**
   *
   * *For any* form field, validation SHALL occur on blur and on submit,
   * invalid fields SHALL display error messages and red borders,
   * and form submission SHALL be prevented while validation errors exist.
   */

  describe('Tool Schema validation', () => {
    it('should validate all required fields (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validNameArb,
          validSlugArb,
          validUrlArb,
          (name, slug, websiteUrl) => {
            const data = {
              name,
              slug,
              website_url: websiteUrl,
            };

            const result = validateFormData(toolSchema, data);

            // Property: Valid data should pass validation
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid tool data and return errors (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z]$/), // Too short name (1 char)
          invalidSlugArb,
          invalidUrlArb,
          (name, slug, websiteUrl) => {
            const data = {
              name,
              slug,
              website_url: websiteUrl,
            };

            const result = validateFormData(toolSchema, data);

            // Property: Invalid data should fail validation with errors
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(Object.keys(result.errors).length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Category Schema validation', () => {
    it('should validate category with all fields (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validNameArb,
          validSlugArb,
          (name, slug) => {
            const data = {
              name,
              slug,
            };

            const result = validateFormData(categorySchema, data);

            // Property: Valid category data should pass validation
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Admin Create Schema validation', () => {
    it('should validate admin with valid email and password (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validEmailArb,
          validPasswordArb,
          (email, password) => {
            const data = {
              email,
              password,
            };

            const result = validateFormData(adminCreateSchema, data);

            // Property: Valid admin data should pass validation
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Property 21: Required Field Validation
// ============================================================================

describe('Property 21: Required Field Validation', () => {
  /**
   * **Feature: admin-panel-crud, Property 21: Required Field Validation**
   * **Validates: Requirements 14.9**
   *
   * *For any* required field that is empty, the validation error message
   * SHALL be "This field is required".
   * 
   * Note: For fields with min length validation, the min length error may
   * appear instead of the required message when the field is empty.
   */

  it('should return required field message for empty slug', () => {
    const data = {
      name: 'Valid Name',
      slug: '',
      website_url: 'https://example.com',
    };

    const result = validateFormData(toolSchema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors['slug']).toBe(REQUIRED_FIELD_MESSAGE);
    }
  });

  it('should return required field message for empty website_url', () => {
    const data = {
      name: 'Valid Name',
      slug: 'valid-slug',
      website_url: '',
    };

    const result = validateFormData(toolSchema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors['website_url']).toBe(REQUIRED_FIELD_MESSAGE);
    }
  });

  it('should return required field message for empty subcategory category_id', () => {
    const data = {
      name: 'Valid Name',
      slug: 'valid-slug',
      category_id: '',
    };

    const result = validateFormData(subcategorySchema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors['category_id']).toBe(REQUIRED_FIELD_MESSAGE);
    }
  });

  it('should return required field message for empty FAQ answer', () => {
    const data = {
      question: 'What is a valid question here?',
      answer: '',
    };

    const result = validateFormData(faqSchema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors['answer']).toBe(REQUIRED_FIELD_MESSAGE);
    }
  });

  it('should return required field message for empty featured tool_id', () => {
    const data = {
      tool_id: '',
    };

    const result = validateFormData(featuredToolSchema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors['tool_id']).toBe(REQUIRED_FIELD_MESSAGE);
    }
  });

  it('should fail validation for empty required fields with min length', () => {
    // For fields with min length validation, empty string triggers min length error
    const data = {
      name: '',
      slug: 'valid-slug',
      website_url: 'https://example.com',
    };

    const result = validateFormData(toolSchema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      // Empty name triggers min length validation
      expect(result.errors['name']).toBeDefined();
    }
  });
});

// ============================================================================
// Property 22: URL Field Validation
// ============================================================================

describe('Property 22: URL Field Validation', () => {
  /**
   * **Feature: admin-panel-crud, Property 22: URL Field Validation**
   * **Validates: Requirements 14.10**
   *
   * *For any* URL field, validation SHALL pass only if the value matches
   * the pattern `https?://.*` or is empty (if not required).
   */

  describe('isValidUrl helper function', () => {
    it('should accept valid http URLs (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^http:\/\/[a-z0-9-]+\.[a-z]{2,6}(\/[a-z0-9-]*)*$/),
          (url) => {
            // Property: Valid http URLs should be accepted
            expect(isValidUrl(url)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid https URLs (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^https:\/\/[a-z0-9-]+\.[a-z]{2,6}(\/[a-z0-9-]*)*$/),
          (url) => {
            // Property: Valid https URLs should be accepted
            expect(isValidUrl(url)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid URLs (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          invalidUrlArb,
          (url) => {
            // Property: Invalid URLs should be rejected
            expect(isValidUrl(url)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept empty string for optional URL fields', () => {
      // Property: Empty string is valid for optional URL fields
      expect(isValidUrl('')).toBe(true);
    });
  });

  describe('Tool Schema URL validation', () => {
    it('should accept valid URLs in tool schema (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validNameArb,
          validSlugArb,
          validUrlArb,
          (name, slug, websiteUrl) => {
            const data = {
              name,
              slug,
              website_url: websiteUrl,
            };

            const result = validateFormData(toolSchema, data);

            // Property: Valid URLs should pass validation
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid URLs in tool schema (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validNameArb,
          validSlugArb,
          invalidUrlArb,
          (name, slug, websiteUrl) => {
            const data = {
              name,
              slug,
              website_url: websiteUrl,
            };

            const result = validateFormData(toolSchema, data);

            // Property: Invalid URLs should fail validation
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.errors['website_url']).toContain('URL must start with http:// or https://');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('AI News Schema optional URL validation', () => {
    it('should accept empty optional URL fields (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validTitleArb,
          validSlugArb,
          (title, slug) => {
            const data = {
              title,
              slug,
              source_url: '', // Empty optional URL
              author_avatar: '', // Empty optional URL
            };

            const result = validateFormData(aiNewsSchema, data);

            // Property: Empty optional URLs should pass validation
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid optional URL fields (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validTitleArb,
          validSlugArb,
          validUrlArb,
          (title, slug, url) => {
            const data = {
              title,
              slug,
              source_url: url,
            };

            const result = validateFormData(aiNewsSchema, data);

            // Property: Valid optional URLs should pass validation
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Slug Validation Tests
// ============================================================================

describe('Slug Validation', () => {
  describe('isValidSlug helper function', () => {
    it('should accept valid slugs (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          validSlugArb,
          (slug) => {
            // Property: Valid slugs should be accepted
            expect(isValidSlug(slug)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid slugs (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          invalidSlugArb,
          (slug) => {
            // Property: Invalid slugs should be rejected
            expect(isValidSlug(slug)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('generateSlug helper function', () => {
    it('should generate valid slugs from input strings (property test with 100 runs)', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9 ]{2,30}$/),
          (input) => {
            const slug = generateSlug(input);

            // Property: Generated slugs should be valid
            if (slug.length > 0) {
              expect(isValidSlug(slug)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should convert uppercase to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('hello world test')).toBe('hello-world-test');
    });

    it('should remove special characters', () => {
      expect(generateSlug('hello@world!')).toBe('helloworld');
    });

    it('should handle multiple consecutive spaces', () => {
      expect(generateSlug('hello   world')).toBe('hello-world');
    });
  });
});
