'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';

export interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * TextareaField component with character counter and validation error display
 * 
 * Requirements: 13.2, 14.3, 14.4
 * - Shows character counter when maxLength is set
 * - Displays inline error messages below the field
 * - Highlights field with red border when validation errors exist
 * - Configurable rows and resize behavior
 */
export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      maxLength,
      rows = 4,
      placeholder,
      required = false,
      disabled = false,
      error,
      helpText,
      resize = 'vertical',
    },
    ref
  ) => {
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    const charCount = value?.length || 0;

    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];

    return (
      <div className="space-y-1.5">
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
          {maxLength && (
            <span
              className={cn(
                'text-xs',
                charCount > maxLength ? 'text-red-500' : 'text-gray-500'
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={inputId}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={cn(error && errorId, helpText && helpId)}
          className={cn(
            'flex w-full rounded-md border bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[44px]', // Touch target size requirement (22.6)
            resizeClass,
            error
              ? 'border-red-500 focus-visible:ring-red-500'
              : 'border-[var(--input)]'
          )}
        />
        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={helpId} className="text-xs text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

TextareaField.displayName = 'TextareaField';
