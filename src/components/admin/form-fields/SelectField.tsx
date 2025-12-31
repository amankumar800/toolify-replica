'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends BaseFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * SelectField component with validation error display
 * 
 * Requirements: 13.2, 14.3, 14.4
 * - Single selection dropdown
 * - Displays inline error messages below the field
 * - Highlights field with red border when validation errors exist
 * - Supports placeholder option
 */
export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      options,
      placeholder = 'Select an option',
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

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = e.target.value;
      onChange(selectedValue === '' ? null : selectedValue);
    };

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium leading-none block',
            disabled && 'opacity-70 cursor-not-allowed'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            name={name}
            value={value ?? ''}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, helpText && helpId)}
            className={cn(
              'flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm',
              'ring-offset-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-[44px]', // Touch target size requirement (22.6)
              'appearance-none cursor-pointer',
              // Padding for custom arrow
              'pr-10',
              !value && 'text-muted-foreground',
              error
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-[var(--input)]'
            )}
          >
            <option value="" disabled={required}>
              {placeholder}
            </option>
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className={cn(
                'h-4 w-4',
                disabled ? 'text-gray-300' : 'text-gray-500'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
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

SelectField.displayName = 'SelectField';
