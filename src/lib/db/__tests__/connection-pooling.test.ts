/**
 * Tests for connection pooling utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CONNECTION_POOLING,
  validateSupabaseConfig,
  getPoolerUrl,
  getProjectRef,
  getPoolingStatus,
} from '../connection-pooling';

describe('Connection Pooling Configuration', () => {
  describe('CONNECTION_POOLING constants', () => {
    it('should have correct transaction mode port', () => {
      expect(CONNECTION_POOLING.TRANSACTION_MODE_PORT).toBe(6543);
    });

    it('should have correct session mode port', () => {
      expect(CONNECTION_POOLING.SESSION_MODE_PORT).toBe(5432);
    });

    it('should have correct free tier max connections', () => {
      expect(CONNECTION_POOLING.FREE_TIER_MAX_CONNECTIONS).toBe(60);
    });

    it('should have correct pro tier max connections', () => {
      expect(CONNECTION_POOLING.PRO_TIER_MAX_CONNECTIONS).toBe(200);
    });

    it('should have serverless pool size of 1', () => {
      expect(CONNECTION_POOLING.SERVERLESS_POOL_SIZE).toBe(1);
    });
  });

  describe('validateSupabaseConfig', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return valid when all required env vars are set', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const result = validateSupabaseConfig();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.poolingEnabled).toBe(true);
    });

    it('should return errors when required env vars are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const result = validateSupabaseConfig();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('NEXT_PUBLIC_SUPABASE_URL is not configured');
      expect(result.errors).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
    });

    it('should warn about placeholder password in DATABASE_URL', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.DATABASE_URL = 'postgresql://postgres.test:[YOUR-PASSWORD]@pooler.supabase.com:6543/postgres';

      const result = validateSupabaseConfig();
      
      expect(result.warnings).toContain('DATABASE_URL contains placeholder password - update with actual password for direct DB access');
    });

    it('should warn when DATABASE_URL does not use transaction mode port', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.DATABASE_URL = 'postgresql://postgres.test:password@pooler.supabase.com:5432/postgres';

      const result = validateSupabaseConfig();
      
      expect(result.warnings).toContain('DATABASE_URL should use port 6543 (Transaction mode) for serverless deployments');
    });
  });

  describe('getPoolerUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return DATABASE_URL for transaction mode', () => {
      const testUrl = 'postgresql://test:password@pooler.supabase.com:6543/postgres';
      process.env.DATABASE_URL = testUrl;

      const result = getPoolerUrl('transaction');
      
      expect(result).toBe(testUrl);
    });

    it('should return DIRECT_URL for session mode', () => {
      const testUrl = 'postgresql://test:password@db.supabase.co:5432/postgres';
      process.env.DIRECT_URL = testUrl;

      const result = getPoolerUrl('session');
      
      expect(result).toBe(testUrl);
    });

    it('should return null when env var is not set', () => {
      delete process.env.DATABASE_URL;
      delete process.env.DIRECT_URL;

      expect(getPoolerUrl('transaction')).toBeNull();
      expect(getPoolerUrl('session')).toBeNull();
    });
  });

  describe('getProjectRef', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should extract project ref from Supabase URL', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefghijk.supabase.co';

      const result = getProjectRef();
      
      expect(result).toBe('abcdefghijk');
    });

    it('should return null when URL is not set', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const result = getProjectRef();
      
      expect(result).toBeNull();
    });

    it('should return null for invalid URL format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';

      const result = getProjectRef();
      
      expect(result).toBeNull();
    });
  });

  describe('getPoolingStatus', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return REST API mode when no DATABASE_URL', () => {
      delete process.env.DATABASE_URL;

      const result = getPoolingStatus();
      
      expect(result.mode).toBe('REST API (PostgREST)');
      expect(result.isOptimalForServerless).toBe(true);
    });

    it('should return REST API mode when DATABASE_URL has placeholder', () => {
      process.env.DATABASE_URL = 'postgresql://test:[YOUR-PASSWORD]@pooler.supabase.com:6543/postgres';

      const result = getPoolingStatus();
      
      expect(result.mode).toBe('REST API (PostgREST)');
      expect(result.isOptimalForServerless).toBe(true);
    });

    it('should return Transaction mode when using port 6543', () => {
      process.env.DATABASE_URL = 'postgresql://test:realpassword@pooler.supabase.com:6543/postgres';

      const result = getPoolingStatus();
      
      expect(result.mode).toBe('Supavisor Transaction Mode');
      expect(result.isOptimalForServerless).toBe(true);
    });

    it('should return Session mode when not using port 6543', () => {
      process.env.DATABASE_URL = 'postgresql://test:realpassword@pooler.supabase.com:5432/postgres';

      const result = getPoolingStatus();
      
      expect(result.mode).toBe('Supavisor Session Mode');
      expect(result.isOptimalForServerless).toBe(false);
    });
  });
});
