import { createAnonClient } from '@/lib/supabase/anon';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();

  try {
    const supabase = createAnonClient();
    const { error } = await supabase.from('tools').select('id').limit(1);

    return Response.json({
      status: error ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      latency: Date.now() - start,
      database: error ? 'error' : 'connected',
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    });
  } catch (e) {
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
