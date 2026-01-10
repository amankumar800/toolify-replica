import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

/**
 * Valid cache tags that can be revalidated.
 * These correspond to the tags used in fetch() calls throughout the application.
 */
const VALID_TAGS = [
  'tools',           // Tool listings
  'categories',      // Category data
  'featured-tools',  // Homepage featured tools
  'news',            // AI news
  'stats',           // Homepage stats
] as const;

type ValidTag = typeof VALID_TAGS[number];

/**
 * POST /api/revalidate
 * 
 * Cache invalidation endpoint for on-demand revalidation.
 * Call this endpoint after admin CRUD operations to refresh cached data.
 * 
 * Request body:
 * - tag: string - The cache tag to revalidate (required)
 * - secret: string - The revalidation secret for authentication (required)
 * - immediate: boolean - If true, expires cache immediately (optional, default: false)
 * 
 * Available tags:
 * - tools: Revalidate tool listings
 * - categories: Revalidate category data
 * - featured-tools: Revalidate homepage featured tools
 * - news: Revalidate AI news
 * - stats: Revalidate homepage stats
 * 
 * Example usage:
 * ```
 * fetch('/api/revalidate', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ tag: 'tools', secret: 'your-secret' })
 * })
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tag, secret, immediate } = body as { 
      tag?: string; 
      secret?: string;
      immediate?: boolean;
    };

    // Validate secret
    const revalidationSecret = process.env.REVALIDATION_SECRET;
    
    if (!revalidationSecret) {
      console.error('[Revalidate] REVALIDATION_SECRET environment variable is not set');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!secret || secret !== revalidationSecret) {
      return Response.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Validate tag is provided
    if (!tag) {
      return Response.json(
        { error: 'Tag required' },
        { status: 400 }
      );
    }

    // Validate tag is one of the allowed values
    if (!VALID_TAGS.includes(tag as ValidTag)) {
      return Response.json(
        { 
          error: 'Invalid tag',
          validTags: VALID_TAGS 
        },
        { status: 400 }
      );
    }

    // Perform revalidation
    // Use immediate=true for webhooks/external services that need instant expiration
    // Otherwise use profile="max" for stale-while-revalidate semantics (recommended)
    if (immediate) {
      revalidateTag(tag, { expire: 0 });
    } else {
      revalidateTag(tag, 'max');
    }

    console.log(`[Revalidate] Successfully revalidated tag: ${tag} (immediate: ${!!immediate})`);

    return Response.json({
      revalidated: true,
      tag,
      immediate: !!immediate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Revalidate] Error processing request:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
