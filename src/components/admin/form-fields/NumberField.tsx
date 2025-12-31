'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';

export interface NumberFieldProps extends BaseFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

/**
 * NumberField component with min/max validation and error display
 * 
 * Requirements: 13.2, 14.3, 14.4
 * - Supports min, max, and step constraints
 * - Displays inline error messages below the field
 * - Highlights field with red border when validation errors exist
 * - Handles null values for optional number fields
 */
export const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      min,
      max,
      step = 1,
      placeholder,
      required = false,
      disabled = false,
      error,
      helpText,
    },
    ref
  ) => {
    const inputId = `field-${name}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === '') {
        onChange(null);
      } else {
        const numValue = parseFloat(inputValue);
        if (!isNaN(numValue)) {
          onChange(numValue);
        }
      }
    };

    // Build constraint hint text
    const constraintHints: string[] = [];
    if (min !== undefined) constraintHints.push(`Min: ${min}`);
    if (max !== undefined) constraintHints.push(`Max: ${max}`);
    const constraintText = constraintHints.length > 0 ? constraintHints.join(', ') : null;

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
          {constraintText && (
            <span className="text-xs text-gray-500">{constraintText}</span>
          )}
        </div>
        <input
          ref={ref}
          id={inputId}
          name={name}
          type="number"
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          aria-invalid={!!error}
          aria-describedby={cn(error && errorId, helpText && helpId)}
          className={cn(
            'flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[44px]', // Touch target size requirement (22.6)
            // Hide spinner buttons for cleaner look
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
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

NumberField.displayName = 'NumberField';
