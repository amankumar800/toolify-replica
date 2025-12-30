/**
 * Property-based tests for JWT utilities
 *
 * Tests Property 8 from the design document:
 * - Property 8: JWT Signature Validation
 *
 * **Feature: admin-auth-separation**
 * **Validates: Requirements 3.6**
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { signToken, verifyToken, JWTPayload } from '../jwt';

describe('JWT Utilities Property Tests', () => {
  // Store original env value
  const originalSecret = process.env.ADMIN_JWT_SECRET;

  beforeAll(() => {
    // Set a test secret for all tests
    process.env.ADMIN_JWT_SECRET = 'test-secret-key-for-jwt-testing-only-32chars';
  });

  afterAll(() => {
    // Restore original env value
    if (originalSecret) {
      process.env.ADMIN_JWT_SECRET = originalSecret;
    } else {
      delete process.env.ADMIN_JWT_SECRET;
    }
  });

  /**
   * **Feature: admin-auth-separation, Property 8: JWT Signature Validation**
   * **Validates: Requirements 3.6**
   *
   * *For any* JWT token, the Admin_System SHALL:
   * - Accept tokens signed with the correct `ADMIN_JWT_SECRET` and not expired
   * - Reject tokens with invalid signatures
   * - Reject tokens that have expired (exp < current time)
   */
  describe('Property 8: JWT Signature Validation', () => {
    // Arbitrary for generating valid admin IDs (UUIDs)
    const uuidArb = fc.uuid();

    // Arbitrary for generating valid email addresses
    const emailArb = fc.emailAddress();

    // Arbitrary for generating sign token input
    const signTokenInputArb = fc.record({
      sub: uuidArb,
      email: emailArb,
    });

    it('should accept tokens signed with correct secret (round-trip property)', async () => {
      await fc.assert(
        fc.asyncProperty(signTokenInputArb, async (input) => {
          // Sign a token
          const token = await signToken(input);

          // Verify the token
          const payload = await verifyToken(token);

          // Property: Token signed with correct secret should verify successfully
          expect(payload).not.toBeNull();
          expect(payload!.sub).toBe(input.sub);
          expect(payload!.email).toBe(input.email);
        }),
        { numRuns: 100 }
      );
    });

    it('should include required claims in signed tokens', async () => {
      await fc.assert(
        fc.asyncProperty(signTokenInputArb, async (input) => {
          const token = await signToken(input);
          const payload = await verifyToken(token);

          // Property: Payload should contain all required claims
          expect(payload).not.toBeNull();
          expect(typeof payload!.sub).toBe('string');
          expect(typeof payload!.email).toBe('string');
          expect(typeof payload!.iat).toBe('number');
          expect(typeof payload!.exp).toBe('number');

          // Property: exp should be greater than iat (token has future expiry)
          expect(payload!.exp).toBeGreaterThan(payload!.iat);

          // Property: exp should be approximately 8 hours after iat
          const expectedExpiry = payload!.iat + 8 * 60 * 60;
          expect(payload!.exp).toBe(expectedExpiry);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject tokens with invalid signatures', async () => {
      await fc.assert(
        fc.asyncProperty(signTokenInputArb, async (input) => {
          // Sign a token with the correct secret
          const token = await signToken(input);

          // Tamper with the token by modifying the signature part
          const parts = token.split('.');
          expect(parts.length).toBe(3);

          // Modify the signature (last part)
          const tamperedSignature = parts[2]
            .split('')
            .reverse()
            .join('');
          const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

          // Property: Tampered token should be rejected
          const payload = await verifyToken(tamperedToken);
          expect(payload).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject tokens signed with different secret', async () => {
      await fc.assert(
        fc.asyncProperty(signTokenInputArb, async (input) => {
          // Sign a token with the current secret
          const token = await signToken(input);

          // Change the secret
          const originalSecret = process.env.ADMIN_JWT_SECRET;
          process.env.ADMIN_JWT_SECRET = 'different-secret-key-for-testing';

          // Property: Token should be rejected with different secret
          const payload = await verifyToken(token);
          expect(payload).toBeNull();

          // Restore the original secret
          process.env.ADMIN_JWT_SECRET = originalSecret;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject malformed tokens', async () => {
      // Arbitrary for generating random strings that are not valid JWTs
      const malformedTokenArb = fc.oneof(
        fc.constant(''),
        fc.constant('not-a-jwt'),
        fc.constant('a.b'),
        fc.constant('a.b.c.d'),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constant('eyJhbGciOiJIUzI1NiJ9.invalid.signature')
      );

      await fc.assert(
        fc.asyncProperty(malformedTokenArb, async (token) => {
          // Property: Malformed tokens should be rejected
          const payload = await verifyToken(token);
          expect(payload).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject null and undefined tokens', async () => {
      // Property: null token should be rejected
      const nullResult = await verifyToken(null as unknown as string);
      expect(nullResult).toBeNull();

      // Property: undefined token should be rejected
      const undefinedResult = await verifyToken(undefined as unknown as string);
      expect(undefinedResult).toBeNull();
    });
  });

  /**
   * Additional edge case tests for signToken
   */
  describe('signToken edge cases', () => {
    it('should throw error when ADMIN_JWT_SECRET is not set', async () => {
      const originalSecret = process.env.ADMIN_JWT_SECRET;
      delete process.env.ADMIN_JWT_SECRET;

      await expect(
        signToken({ sub: 'test-id', email: 'test@example.com' })
      ).rejects.toThrow('ADMIN_JWT_SECRET environment variable is not set');

      // Restore
      process.env.ADMIN_JWT_SECRET = originalSecret;
    });

    it('should handle emails with special characters', async () => {
      const specialEmails = [
        'test+tag@example.com',
        'user.name@example.co.uk',
        'admin@sub.domain.example.com',
      ];

      for (const email of specialEmails) {
        const token = await signToken({ sub: 'test-id', email });
        const payload = await verifyToken(token);

        expect(payload).not.toBeNull();
        expect(payload!.email).toBe(email);
      }
    });

    it('should produce different tokens for different inputs', async () => {
      const token1 = await signToken({ sub: 'id-1', email: 'user1@example.com' });
      const token2 = await signToken({ sub: 'id-2', email: 'user2@example.com' });

      expect(token1).not.toBe(token2);
    });
  });

  /**
   * Additional edge case tests for verifyToken
   */
  describe('verifyToken edge cases', () => {
    it('should return null when ADMIN_JWT_SECRET is not set during verification', async () => {
      // First sign a token with the secret
      const token = await signToken({ sub: 'test-id', email: 'test@example.com' });

      // Remove the secret
      const originalSecret = process.env.ADMIN_JWT_SECRET;
      delete process.env.ADMIN_JWT_SECRET;

      // Verification should return null (not throw) for security reasons
      // This prevents information leakage about configuration issues
      const result = await verifyToken(token);
      expect(result).toBeNull();

      // Restore
      process.env.ADMIN_JWT_SECRET = originalSecret;
    });
  });
});
