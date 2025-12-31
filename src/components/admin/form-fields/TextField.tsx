'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Base field props shared across all form field components
 */
export interface BaseFieldProps {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
}

export interface TextFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'url';
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
}

/**
 * TextField component with character counter and validation error display
 * 
 * Requirements: 13.2, 14.3, 14.4
 * - Supports text, email, password, url types
 * - Shows character counter when maxLength is set
 * - Displays inline error messages below the field
 * - Highlights field with red border when validation errors exist
 */
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      name,
      label,
      type = 'text',
      value,
      onChange,
      maxLength,
      placeholder,
      required = false,
      disabled = false,
      error,
      helpText,
      autoComplete,
    },
    ref
  ) => {
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    const charCount = value?.length || 0;

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
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={cn(error && errorId, helpText && helpId)}
          className={cn(
            'flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[44px]', // Touch target size requirement (22.6)
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

TextField.displayName = 'TextField';
