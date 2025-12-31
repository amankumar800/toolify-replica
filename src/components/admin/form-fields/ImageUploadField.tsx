'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';

export interface ImageUploadFieldProps extends BaseFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  accept?: string[];
  maxSize?: number; // in bytes
  onUpload?: (file: File) => Promise<string>; // Returns URL after upload
}

/**
 * ImageUploadField component with preview and drag-drop
 * 
 * Requirements: 13.2
 * - Image preview
 * - Drag and drop support
 * - File type and size validation
 * - Displays inline error messages
 * 
 * Note: If onUpload is not provided, uses URL input mode
 */
export const ImageUploadField = React.forwardRef<HTMLDivElement, ImageUploadFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      accept = ['image/jpeg', 'image/png', 'image/webp'],
      maxSize = 5 * 1024 * 1024, // 5MB default
      onUpload,
      required = false,
      disabled = false,
      error,
      helpText,
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    const [mode, setMode] = React.useState<'upload' | 'url'>(onUpload ? 'upload' : 'url');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    const displayError = error || uploadError;

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const validateFile = (file: File): string | null => {
      if (!accept.includes(file.type)) {
        return `Invalid file type. Accepted: ${accept.map(t => t.split('/')[1]).join(', ')}`;
      }
      if (file.size > maxSize) {
        return `File too large. Maximum size: ${formatFileSize(maxSize)}`;
      }
      return null;
    };

    const handleFile = async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setUploadError(null);

      if (onUpload) {
        setIsUploading(true);
        try {
          const url = await onUpload(file);
          onChange(url);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
          setIsUploading(false);
        }
      } else {
        // Create local preview URL
        const url = URL.createObjectURL(file);
        onChange(url);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || mode !== 'upload') return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && mode === 'upload') {
        setIsDragging(true);
      }
    };

    const handleDragLeave = () => {
      setIsDragging(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value || null);
    };

    const handleClear = () => {
      onChange(null);
      setUploadError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    return (
      <div className="space-y-1.5" ref={ref}>
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium leading-none',
              disabled && 'opacity-70 cursor-not-allowed'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {onUpload && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  mode === 'upload' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setMode('url')}
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  mode === 'url' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                URL
              </button>
            </div>
          )}
        </div>

        {mode === 'url' ? (
          <input
            id={inputId}
            type="url"
            value={value || ''}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
            disabled={disabled}
            aria-invalid={!!displayError}
            aria-describedby={cn(displayError && errorId, helpText && helpId)}
            className={cn(
              'flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm',
              'ring-offset-background placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-[44px]',
              displayError
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-[var(--input)]'
            )}
          />
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'relative rounded-md border-2 border-dashed p-4 transition-colors',
              'min-h-[120px] flex flex-col items-center justify-center gap-2',
              isDragging && 'border-blue-500 bg-blue-50',
              disabled && 'opacity-50 cursor-not-allowed',
              displayError ? 'border-red-300' : 'border-gray-300'
            )}
          >
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept={accept.join(',')}
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
              className="sr-only"
              aria-invalid={!!displayError}
              aria-describedby={cn(displayError && errorId, helpText && helpId)}
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gray-500">Uploading...</span>
              </div>
            ) : (
              <>
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-center">
                  <label
                    htmlFor={inputId}
                    className={cn(
                      'text-sm text-blue-600 hover:text-blue-700 cursor-pointer',
                      disabled && 'cursor-not-allowed'
                    )}
                  >
                    Click to upload
                  </label>
                  <span className="text-sm text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-400">
                  {accept.map(t => t.split('/')[1].toUpperCase()).join(', ')} up to {formatFileSize(maxSize)}
                </p>
              </>
            )}
          </div>
        )}

        {/* Preview */}
        {value && (
          <div className="relative inline-block mt-2">
            <img
              src={value}
              alt="Preview"
              className="max-h-32 rounded-md border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
              aria-label="Remove image"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {displayError && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {displayError}
          </p>
        )}
        {helpText && !displayError && (
          <p id={helpId} className="text-xs text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

ImageUploadField.displayName = 'ImageUploadField';
