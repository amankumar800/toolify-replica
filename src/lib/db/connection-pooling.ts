/**
 * Connection Pooling Configuration for Supabase
 * 
 * This file provides connection pooling utilities and health checks for Supabase.
 * 
 * ## Current Architecture
 * 
 * This application uses the Supabase JavaScript client (@supabase/ssr, @supabase/supabase-js)
 * which communicates via the REST API (PostgREST). The REST API layer already handles
 * connection pooling automatically on Supabase's infrastructure.
 * 
 * **The Supabase JS client is optimized for serverless environments like Vercel.**
 * 
 * ## Connection Pooling Status: ✅ ENABLED
 * 
 * - REST API (PostgREST): Automatic pooling via Supabase infrastructure
 * - Direct connections: Supavisor pooler configured (Transaction mode, port 6543)
 * - Singleton patterns: Implemented in client.ts and admin.ts to prevent connection leaks
 * 
 * ## Supavisor Connection Pooler
 * 
 * Supabase uses Supavisor for connection pooling with two modes:
 * 
 * ### Transaction Mode (Port 6543) - Recommended for Serverless
 * - Best for Vercel, AWS Lambda, and other serverless environments
 * - Connections are returned to the pool after each transaction
 * - Cannot use prepared statements or session-level features
 * - URL: postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 * 
 * ### Session Mode (Port 5432)
 * - Best for long-running connections and migrations
 * - Connection persists for the entire session
 * - Supports prepared statements and session-level features
 * - URL: postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
 * 
 * ## Environment Variables
 * 
 * For the Supabase JS client (current setup):
 * - NEXT_PUBLIC_SUPABASE_URL: REST API endpoint (already pooled)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Public API key
 * - SUPABASE_SERVICE_ROLE_KEY: Server-side admin key
 * 
 * For direct database access (if needed in future):
 * - DATABASE_URL: Transaction mode pooler URL (for serverless)
 * - DIRECT_URL: Session mode URL (for migrations)
 * 
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres
 * @see https://supabase.com/docs/guides/troubleshooting/supavisor-and-connection-terminology-explained-9pr_ZO
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Connection pooling configuration constants.
 */
export const CONNECTION_POOLING = {
  /**
   * Port for Transaction Mode (recommended for serverless)
   * Connections are returned to pool after each transaction
   */
  TRANSACTION_MODE_PORT: 6543,
  
  /**
   * Port for Session Mode (for migrations and long-running connections)
   * Connection persists for entire session
   */
  SESSION_MODE_PORT: 5432,
  
  /**
   * Maximum connections for free tier
   */
  FREE_TIER_MAX_CONNECTIONS: 60,
  
  /**
   * Maximum connections for Pro tier
   */
  PRO_TIER_MAX_CONNECTIONS: 200,
  
  /**
   * Recommended pool size for serverless (per function instance)
   */
  SERVERLESS_POOL_SIZE: 1,
  
  /**
   * Connection timeout in milliseconds
   */
  CONNECTION_TIMEOUT_MS: 5000,
} as const;

/**
 * Connection health status
 */
export interface ConnectionHealthStatus {
  healthy: boolean;
  latencyMs: number;
  timestamp: string;
  poolingMode: 'rest-api' | 'transaction' | 'session';
  error?: string;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  poolingEnabled: boolean;
  poolingMode: string;
}

/**
 * Validates that the Supabase environment variables are configured.
 * This is useful for debugging connection issues.
 */
export function validateSupabaseConfig(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
  }
  
  // Optional but recommended
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY is not configured (recommended for server-side operations)');
  }
  
  // Check DATABASE_URL format for direct connections
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    if (databaseUrl.includes('[YOUR-PASSWORD]')) {
      warnings.push('DATABASE_URL contains placeholder password - update with actual password for direct DB access');
    }
    if (!databaseUrl.includes(':6543')) {
      warnings.push('DATABASE_URL should use port 6543 (Transaction mode) for serverless deployments');
    }
  }
  
  // Determine pooling mode
  let poolingMode = 'rest-api';
  if (databaseUrl && !databaseUrl.includes('[YOUR-PASSWORD]')) {
    poolingMode = databaseUrl.includes(':6543') ? 'transaction' : 'session';
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    poolingEnabled: true, // REST API always has pooling
    poolingMode,
  };
}

/**
 * Checks the health of the Supabase connection.
 * Uses a lightweight query to verify connectivity.
 */
export async function checkConnectionHealth(): Promise<ConnectionHealthStatus> {
  const startTime = Date.now();
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        healthy: false,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        poolingMode: 'rest-api',
        error: 'Missing Supabase configuration',
      };
    }
    
    // Create a temporary client for health check
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Execute a lightweight query to check connectivity
    // Using a simple RPC call or table count
    const { error } = await client.from('tools').select('id', { count: 'exact', head: true });
    
    const latencyMs = Date.now() - startTime;
    
    if (error) {
      return {
        healthy: false,
        latencyMs,
        timestamp: new Date().toISOString(),
        poolingMode: 'rest-api',
        error: error.message,
      };
    }
    
    return {
      healthy: true,
      latencyMs,
      timestamp: new Date().toISOString(),
      poolingMode: 'rest-api',
    };
  } catch (err) {
    return {
      healthy: false,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      poolingMode: 'rest-api',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Gets the pooler URL from environment or constructs it from project ref.
 * Only needed if using direct database connections.
 */
export function getPoolerUrl(mode: 'transaction' | 'session' = 'transaction'): string | null {
  // Check if DATABASE_URL is already configured
  if (mode === 'transaction' && process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  if (mode === 'session' && process.env.DIRECT_URL) {
    return process.env.DIRECT_URL;
  }
  
  // Cannot construct URL without password
  return null;
}

/**
 * Extracts the project reference from the Supabase URL.
 */
export function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  
  // Extract project ref from URL like https://xxxxx.supabase.co
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

/**
 * Gets a summary of the current connection pooling configuration.
 */
export function getPoolingStatus(): {
  mode: string;
  description: string;
  isOptimalForServerless: boolean;
} {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Default: REST API pooling (always enabled)
  if (!databaseUrl || databaseUrl.includes('[YOUR-PASSWORD]')) {
    return {
      mode: 'REST API (PostgREST)',
      description: 'Connection pooling handled automatically by Supabase infrastructure. Optimal for serverless.',
      isOptimalForServerless: true,
    };
  }
  
  // Check if using transaction mode
  if (databaseUrl.includes(':6543')) {
    return {
      mode: 'Supavisor Transaction Mode',
      description: 'Direct database connections via Supavisor pooler (port 6543). Connections returned after each transaction.',
      isOptimalForServerless: true,
    };
  }
  
  // Session mode
  return {
    mode: 'Supavisor Session Mode',
    description: 'Direct database connections via Supavisor pooler (port 5432). Connections persist for session duration.',
    isOptimalForServerless: false,
  };
}
