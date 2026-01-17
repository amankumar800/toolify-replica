/**
 * API Route: /api/my-tools
 * 
 * Manages user's personalized "My Tools" list.
 * Requires authentication for all operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createUserFavoritesRepository } from '@/lib/db/repositories/user-favorites.repository';
import { revalidateTag } from 'next/cache';

// Rate limiting: Simple in-memory (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

/**
 * GET /api/my-tools
 * Returns the current user's favorite tools
 */
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const repo = createUserFavoritesRepository(supabase);
        const favorites = await repo.findByUser(user.email);

        return NextResponse.json({ tools: favorites });
    } catch (error) {
        console.error('[api/my-tools] Failed to fetch user tools:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tools' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/my-tools
 * Adds a tool to the user's favorites
 * Body: { toolId: string, toolName?: string }
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const { toolId, toolName } = body;

        if (!toolId || typeof toolId !== 'string') {
            return NextResponse.json(
                { error: 'toolId is required' },
                { status: 400 }
            );
        }

        const repo = createUserFavoritesRepository(supabase);
        const result = await repo.addFavorite(user.email, toolId, toolName);

        revalidateTag('homepage', 'max');
        return NextResponse.json({ success: true, tool: result });
    } catch (error) {
        console.error('[api/my-tools] Failed to add tool:', error);
        return NextResponse.json(
            { error: 'Failed to add tool' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/my-tools?toolId=xxx
 * Removes a tool from the user's favorites
 */
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        const toolId = request.nextUrl.searchParams.get('toolId');

        if (!toolId) {
            return NextResponse.json(
                { error: 'toolId query parameter is required' },
                { status: 400 }
            );
        }

        const repo = createUserFavoritesRepository(supabase);
        await repo.removeFavorite(user.email, toolId);

        revalidateTag('homepage', 'max');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[api/my-tools] Failed to remove tool:', error);
        return NextResponse.json(
            { error: 'Failed to remove tool' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/my-tools
 * Reorders the user's shortcut tools
 * Body: { toolIds: string[] }
 */
export async function PUT(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const { toolIds } = body;

        if (!Array.isArray(toolIds)) {
            return NextResponse.json(
                { error: 'toolIds must be an array' },
                { status: 400 }
            );
        }

        const repo = createUserFavoritesRepository(supabase);
        await repo.reorderShortcuts(user.email, toolIds);

        revalidateTag('homepage', 'max');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[api/my-tools] Failed to reorder tools:', error);
        return NextResponse.json(
            { error: 'Failed to reorder tools' },
            { status: 500 }
        );
    }
}
