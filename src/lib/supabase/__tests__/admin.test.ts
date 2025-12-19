import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store original env values
const originalEnv = { ...process.env };

describe('createAdminClient', () => {
  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules();
    // Set up valid environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  it('creates client with valid credentials', async () => {
    const { createAdminClient } = await import('../admin');
    
    const client = createAdminClient();
    
    expect(client).toBeDefined();
    expect(typeof client.from).toBe('function');
    expect(typeof client.auth).toBe('object');
  });

  it('throws error when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const { createAdminClient } = await import('../admin');
    
    expect(() => createAdminClient()).toThrow(
      'Missing Supabase admin credentials: SUPABASE_SERVICE_ROLE_KEY'
    );
  });

  it('throws error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const { createAdminClient } = await import('../admin');
    
    expect(() => createAdminClient()).toThrow(
      'Missing Supabase admin credentials: NEXT_PUBLIC_SUPABASE_URL'
    );
  });
});
