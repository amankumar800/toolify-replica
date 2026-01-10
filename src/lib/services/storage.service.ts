/**
 * Storage Service
 * 
 * Handles file uploads to Supabase Storage.
 * Uses the admin client to bypass RLS for server-side operations.
 * 
 * @module storage.service
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('StorageService');

// Storage bucket names
export const STORAGE_BUCKETS = {
  TOOL_IMAGES: 'tool-images',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

// Allowed MIME types for tool images
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type AllowedImageType = typeof ALLOWED_IMAGE_TYPES[number];

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Result of an upload operation
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Options for uploading a file
 */
export interface UploadOptions {
  /** The storage bucket to upload to */
  bucket: StorageBucket;
  /** Optional folder path within the bucket */
  folder?: string;
  /** Whether to overwrite existing files with the same name */
  upsert?: boolean;
  /** Cache control header value (in seconds) */
  cacheControl?: number;
}

/**
 * Generates a unique filename for uploaded files
 * Format: {timestamp}-{random}-{sanitized-original-name}
 */
export function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  // Sanitize the original filename
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const baseName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
  
  return `${timestamp}-${random}-${baseName}.${extension}`;
}

/**
 * Validates a file for upload
 */
export function validateFile(
  file: { type: string; size: number },
  allowedTypes: readonly string[] = ALLOWED_IMAGE_TYPES,
  maxSize: number = MAX_FILE_SIZE
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Uploads a file to Supabase Storage
 * 
 * @param fileBuffer - The file data as a Buffer or Uint8Array
 * @param filename - The original filename
 * @param contentType - The MIME type of the file
 * @param options - Upload options
 * @returns Upload result with URL or error
 */
export async function uploadFile(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  contentType: string,
  options: UploadOptions
): Promise<UploadResult> {
  const { bucket, folder, upsert = true, cacheControl = 31536000 } = options;

  try {
    const supabase = createAdminClient();
    
    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(filename);
    const filePath = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

    log.info('Uploading file to storage', { 
      bucket, 
      path: filePath, 
      contentType,
      size: fileBuffer.length 
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: cacheControl.toString(),
        upsert,
      });

    if (error) {
      log.error('Storage upload failed', error, { action: 'upload', data: { bucket, path: filePath } });
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    log.info('File uploaded successfully', { 
      bucket, 
      path: data.path, 
      url: urlData.publicUrl 
    });

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    log.error('Unexpected error during upload', error, { action: 'upload', data: { bucket, filename } });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Uploads a tool image to the tool-images bucket
 * 
 * @param fileBuffer - The image data
 * @param filename - The original filename
 * @param contentType - The MIME type
 * @returns Upload result with public URL
 */
export async function uploadToolImage(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  // Validate file type
  const validation = validateFile(
    { type: contentType, size: fileBuffer.length },
    ALLOWED_IMAGE_TYPES,
    MAX_FILE_SIZE
  );

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  return uploadFile(fileBuffer, filename, contentType, {
    bucket: STORAGE_BUCKETS.TOOL_IMAGES,
    upsert: true,
    cacheControl: 31536000, // 1 year cache
  });
}

/**
 * Deletes a file from Supabase Storage
 * 
 * @param bucket - The storage bucket
 * @param path - The file path within the bucket
 * @returns Success status
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      log.error('Storage delete failed', error, { action: 'delete', data: { bucket, path } });
      return {
        success: false,
        error: error.message,
      };
    }

    log.info('File deleted successfully', { bucket, path });
    return { success: true };
  } catch (error) {
    log.error('Unexpected error during delete', error, { action: 'delete', data: { bucket, path } });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Extracts the file path from a Supabase Storage public URL
 * 
 * @param url - The public URL
 * @param bucket - The storage bucket name
 * @returns The file path or null if not a valid storage URL
 */
export function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`));
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Checks if a URL is a Supabase Storage URL for the given bucket
 */
export function isStorageUrl(url: string, bucket: StorageBucket): boolean {
  return extractPathFromUrl(url, bucket) !== null;
}
