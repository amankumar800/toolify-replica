'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from './TextField';

export interface DateFieldProps extends BaseFieldProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  includeTime?: boolean;
}

/**
 * DateField component for date/datetime selection
 * 
 * Requirements: 13.2
 * - Native date/datetime-local input
 * - Supports min/max date constraints
 * - Optional time selection
 * - Displays inline error messages
 */
export const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      name,
      label,
      value,
      onChange,
      minDate,
      maxDate,
      includeTime = false,
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

    // Format date for input value
    const formatDateForInput = (date: Date | null): string => {
      if (!date) return '';
      
      if (includeTime) {
        // Format as datetime-local: YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } else {
        // Format as date: YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    };

    // Format date for min/max attributes
    const formatConstraintDate = (date: Date | undefined): string | undefined => {
      if (!date) return undefined;
      return formatDateForInput(date);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (!inputValue) {
        onChange(null);
      } else {
        const newDate = new Date(inputValue);
        if (!isNaN(newDate.getTime())) {
          onChange(newDate);
        }
      }
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
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={includeTime ? 'datetime-local' : 'date'}
          value={formatDateForInput(value)}
          onChange={handleChange}
          min={formatConstraintDate(minDate)}
          max={formatConstraintDate(maxDate)}
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

DateField.displayName = 'DateField';
