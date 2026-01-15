/**
 * API Route: /api/my-tools/available
 * 
 * Returns paginated list of tools available to add to favorites.
 * Public endpoint (no auth required), but marks favorited tools for logged-in users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAnonClient } from '@/lib/supabase/anon';

// Rate limiting (reuse pattern from parent route)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

interface AvailableTool {
    id: string;
    name: string;
    slug: string;
    icon: string;
    isFavorited: boolean;
}

interface AvailableToolsResponse {
    tools: AvailableTool[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    };
}

/**
 * GET /api/my-tools/available?q=search&page=1&limit=20
 */
export async function GET(request: NextRequest) {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
        );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Get user session (optional)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || null;

    // Get user's favorited tool IDs if logged in
    let favoritedIds: Set<string> = new Set();
    if (userEmail) {
        const { data: favorites } = await supabase
            .from('user_favorites')
            .select('tool_id')
            .eq('user_email', userEmail);
        favoritedIds = new Set((favorites || []).map(f => f.tool_id));
    }

    // Query tools from database (use anon for public data)
    const anonClient = createAnonClient();

    // Build query
    let toolsQuery = anonClient
        .from('tools')
        .select('id, name, slug, image_url, website_url', { count: 'exact' })
        .eq('status', 'published')
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

    // Add search filter if provided
    if (query.trim()) {
        toolsQuery = toolsQuery.ilike('name', `%${query.trim()}%`);
    }

    const { data: tools, count, error } = await toolsQuery;

    if (error) {
        console.error('[api/my-tools/available] Query error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tools' },
            { status: 500 }
        );
    }

    // Transform to response format
    const transformedTools: AvailableTool[] = (tools || []).map(tool => ({
        id: tool.slug,
        name: tool.name,
        slug: tool.slug,
        icon: tool.image_url || `https://www.google.com/s2/favicons?domain=${(() => {
                try { return new URL(tool.website_url).hostname; }
                catch { return ''; }
            })()
            }&sz=64`,
        isFavorited: favoritedIds.has(tool.slug),
    }));

    const total = count || 0;
    const response: AvailableToolsResponse = {
        tools: transformedTools,
        pagination: {
            page,
            limit,
            total,
            hasMore: offset + limit < total,
        },
    };

    return NextResponse.json(response);
}
