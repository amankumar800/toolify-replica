import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const startTime = Date.now();

/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring services.
 * Returns application status, timestamp, and optional database connectivity.
 * 
 * Query params:
 * - deep=true: Include database connectivity check
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deepCheck = searchParams.get('deep') === 'true';

  const healthResponse: {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    uptime: number;
    database?: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  // Optional deep health check including database
  if (deepCheck) {
    try {
      const dbStart = Date.now();
      const supabase = await createClient();
      
      // Simple query to verify database connectivity
      const { error } = await supabase.from('tools').select('id').limit(1);
      
      const dbLatency = Date.now() - dbStart;
      
      if (error) {
        healthResponse.status = 'degraded';
        healthResponse.database = {
          status: 'disconnected',
        };
      } else {
        healthResponse.database = {
          status: 'connected',
          latency: dbLatency,
        };
      }
    } catch {
      healthResponse.status = 'degraded';
      healthResponse.database = {
        status: 'disconnected',
      };
    }
  }

  const statusCode = healthResponse.status === 'ok' ? 200 : 503;
  
  return Response.json(healthResponse, { status: statusCode });
}
