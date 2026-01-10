/**
 * Tool Image Upload API Route
 * 
 * POST /api/admin/upload/tool-image
 * 
 * Handles image uploads for tools. Accepts multipart/form-data with a single file.
 * Returns the public URL of the uploaded image.
 * 
 * Requirements: P3-1 - Implement Supabase Storage for Images
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/admin-auth.service';
import { uploadToolImage, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/services/storage.service';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('ToolImageUploadAPI');

/**
 * POST /api/admin/upload/tool-image
 * 
 * Upload a tool image to Supabase Storage
 * 
 * Request: multipart/form-data with 'file' field
 * Response: { url: string } on success
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: adminMutation (60 req/min)
    const rateLimitResponse = await checkRateLimit(request, { type: 'adminMutation', useAuth: true });
    if (rateLimitResponse) return rateLimitResponse;

    // Require admin authentication
    await requireAdmin();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      return NextResponse.json(
        { 
          error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.map(t => t.split('/')[1]).join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const result = await uploadToolImage(buffer, file.name, file.type);

    if (!result.success) {
      log.error('Tool image upload failed', { error: result.error });
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    log.info('Tool image uploaded successfully', { 
      url: result.url,
      path: result.path,
      originalName: file.name,
      size: file.size
    });

    return NextResponse.json({ 
      url: result.url,
      path: result.path 
    });

  } catch (error) {
    log.error('Error uploading tool image', error, { action: 'POST' });
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
